import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:photo_manager/photo_manager.dart';

/// 照片选择器页面
/// 支持逐张勾选、按日期全选、按影集全选、一键全选
class PhotoPickerPage extends StatefulWidget {
  const PhotoPickerPage({super.key});

  @override
  State<PhotoPickerPage> createState() => _PhotoPickerPageState();
}

class _PhotoPickerPageState extends State<PhotoPickerPage> {
  /// 全部影集列表
  List<AssetPathEntity> _albums = [];

  /// 当前选中的影集
  AssetPathEntity? _currentAlbum;

  /// 当前影集按日期分组的照片数据
  /// key: 日期字符串（yyyy-MM-dd），value: 该日期的照片列表
  List<_DateGroup> _dateGroups = [];

  /// 已选照片 id 集合（用于 O(1) 查询）
  final Set<String> _selectedIds = {};

  /// 已选照片有序列表（用于显示序号）
  final List<AssetEntity> _selectedList = [];

  /// 是否正在加载
  bool _loading = true;

  /// 当前影集总照片数（用于分页）
  int _totalCount = 0;

  /// 已加载照片数
  int _loadedCount = 0;

  /// 每页加载数量
  static const int _pageSize = 80;

  /// 滚动控制器（用于检测触底分页）
  final ScrollController _scrollController = ScrollController();

  /// 缩略图 Future 缓存：key 为 asset.id
  /// 避免 setState 重建时重复触发 thumbnailData 导致图片闪烁
  final Map<String, Future<Uint8List?>> _thumbnailCache = {};

  /// 是否正在执行全选预加载（显示全屏遮罩，禁用全选/确认按钮）
  bool _isSelectAllLoading = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _requestPermissionAndLoad();
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  /// 请求相册权限，获取后加载影集列表
  Future<void> _requestPermissionAndLoad() async {
    final permission = await PhotoManager.requestPermissionExtend();
    if (!mounted) return;

    if (!permission.isAuth && permission != PermissionState.limited) {
      // 权限拒绝，返回上一页
      Navigator.of(context).pop();
      return;
    }

    await _loadAlbums();
  }

  /// 加载全部影集列表，默认选中第一个（所有照片）
  Future<void> _loadAlbums() async {
    final albums = await PhotoManager.getAssetPathList(
      type: RequestType.image,
      hasAll: true,
    );
    if (!mounted) return;

    setState(() {
      _albums = albums;
      _currentAlbum = albums.isNotEmpty ? albums.first : null;
    });

    if (_currentAlbum != null) {
      await _loadPhotos(reset: true);
    } else {
      setState(() => _loading = false);
    }
  }

  /// 加载当前影集的照片（支持分页，reset=true 时重置）
  Future<void> _loadPhotos({bool reset = false}) async {
    if (_currentAlbum == null) return;

    if (reset) {
      _totalCount = await _currentAlbum!.assetCountAsync;
      _loadedCount = 0;
      _dateGroups = [];
    }

    if (_loadedCount >= _totalCount) {
      setState(() => _loading = false);
      return;
    }

    setState(() => _loading = true);

    final page = _loadedCount ~/ _pageSize;
    final assets = await _currentAlbum!.getAssetListPaged(
      page: page,
      size: _pageSize,
    );

    if (!mounted) return;

    _loadedCount += assets.length;

    // 按日期分组合并
    final newGroups = _groupByDate(assets);
    setState(() {
      _mergeGroups(newGroups);
      _loading = false;
    });
  }

  /// 将照片列表按拍摄日期（yyyy-MM-dd）分组
  List<_DateGroup> _groupByDate(List<AssetEntity> assets) {
    final Map<String, List<AssetEntity>> map = {};
    for (final asset in assets) {
      final dt = asset.createDateTime;
      final key =
          '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
      map.putIfAbsent(key, () => []).add(asset);
    }

    return map.entries
        .map((e) => _DateGroup(date: e.key, assets: e.value))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
  }

  /// 将新分组合并到现有分组（同一天的追加到末尾）
  void _mergeGroups(List<_DateGroup> newGroups) {
    for (final ng in newGroups) {
      final existing = _dateGroups.where((g) => g.date == ng.date).firstOrNull;
      if (existing != null) {
        existing.assets.addAll(ng.assets);
      } else {
        _dateGroups.add(ng);
      }
    }
    _dateGroups.sort((a, b) => b.date.compareTo(a.date));
  }

  /// 滚动到底部时触发分页加载
  void _onScroll() {
    if (_scrollController.position.pixels >=
            _scrollController.position.maxScrollExtent - 200 &&
        !_loading &&
        _loadedCount < _totalCount) {
      _loadPhotos();
    }
  }

  // ── 选择逻辑 ─────────────────────────────────────────────

  /// 切换单张照片的选中状态
  void _toggleAsset(AssetEntity asset) {
    setState(() {
      if (_selectedIds.contains(asset.id)) {
        _selectedIds.remove(asset.id);
        _selectedList.removeWhere((a) => a.id == asset.id);
      } else {
        _selectedIds.add(asset.id);
        _selectedList.add(asset);
      }
    });
  }

  /// 预加载当前影集全部照片（不调用 setState，由调用方统一刷新）
  /// 循环分页直到 _loadedCount >= _totalCount，每批合并到 _dateGroups
  Future<void> _loadAllAssets() async {
    if (_currentAlbum == null) return;
    // 确保 _totalCount 已初始化
    if (_totalCount == 0) {
      _totalCount = await _currentAlbum!.assetCountAsync;
    }
    // 已全部加载则跳过
    if (_loadedCount >= _totalCount) return;

    while (_loadedCount < _totalCount) {
      final page = _loadedCount ~/ _pageSize;
      final assets = await _currentAlbum!.getAssetListPaged(
        page: page,
        size: _pageSize,
      );
      if (assets.isEmpty) break;
      _loadedCount += assets.length;
      final newGroups = _groupByDate(assets);
      _mergeGroups(newGroups);
    }
  }

  /// 切换某日期分组的全选/全取消
  /// 先确保全部照片已加载，再按日期重新匹配 group 执行全选
  Future<void> _toggleDateGroup(_DateGroup group) async {
    final targetDate = group.date;
    setState(() => _isSelectAllLoading = true);
    try {
      await _loadAllAssets();
      // 加载完成后重新查找目标日期（引用可能已变）
      final targetGroup = _dateGroups.where((g) => g.date == targetDate).firstOrNull;
      if (targetGroup == null) return;
      final allSelected = targetGroup.assets.every((a) => _selectedIds.contains(a.id));
      setState(() {
        if (allSelected) {
          for (final a in targetGroup.assets) {
            _selectedIds.remove(a.id);
            _selectedList.removeWhere((x) => x.id == a.id);
          }
        } else {
          for (final a in targetGroup.assets) {
            if (!_selectedIds.contains(a.id)) {
              _selectedIds.add(a.id);
              _selectedList.add(a);
            }
          }
        }
      });
    } finally {
      if (mounted) setState(() => _isSelectAllLoading = false);
    }
  }

  /// 全选/全取消当前影集所有照片（先加载全部再操作）
  Future<void> _toggleSelectAll() async {
    setState(() => _isSelectAllLoading = true);
    try {
      await _loadAllAssets();
      final allLoaded = _dateGroups.expand((g) => g.assets).toList();
      final allSelected = allLoaded.every((a) => _selectedIds.contains(a.id));
      setState(() {
        if (allSelected) {
          for (final a in allLoaded) {
            _selectedIds.remove(a.id);
            _selectedList.removeWhere((x) => x.id == a.id);
          }
        } else {
          for (final a in allLoaded) {
            if (!_selectedIds.contains(a.id)) {
              _selectedIds.add(a.id);
              _selectedList.add(a);
            }
          }
        }
      });
    } finally {
      if (mounted) setState(() => _isSelectAllLoading = false);
    }
  }

  // ── 确认回传 ─────────────────────────────────────────────

  void _onConfirm() {
    if (_selectedList.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('请至少选择一张照片'),
          duration: Duration(seconds: 1),
        ),
      );
      return;
    }
    Navigator.of(context).pop(List<AssetEntity>.from(_selectedList));
  }

  // ── 影集切换 ─────────────────────────────────────────────

  void _showAlbumPicker() {
    showModalBottomSheet<AssetPathEntity>(
      context: context,
      builder: (ctx) => ListView.builder(
        itemCount: _albums.length,
        itemBuilder: (_, i) {
          final album = _albums[i];
          final isSelected = album.id == _currentAlbum?.id;
          return ListTile(
            title: Text(album.name),
            trailing: isSelected ? const Icon(Icons.check, color: Colors.blue) : null,
            onTap: () => Navigator.of(ctx).pop(album),
          );
        },
      ),
    ).then((selected) {
      if (selected != null && selected.id != _currentAlbum?.id) {
        setState(() => _currentAlbum = selected);
        _loadPhotos(reset: true);
      }
    });
  }

  // ── 构建 UI ──────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final allLoaded = _dateGroups.expand((g) => g.assets).toList();
    final isAllSelected =
        allLoaded.isNotEmpty && allLoaded.every((a) => _selectedIds.contains(a.id));

    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            backgroundColor: colorScheme.inversePrimary,
            title: GestureDetector(
              onTap: _showAlbumPicker,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_currentAlbum?.name ?? '相册'),
                  const SizedBox(width: 4),
                  const Icon(Icons.arrow_drop_down, size: 20),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: _isSelectAllLoading ? null : _toggleSelectAll,
                child: Text(
                  isAllSelected ? '取消全选' : '全选',
                  style: TextStyle(color: colorScheme.onPrimaryContainer),
                ),
              ),
            ],
          ),
          body: _loading && _dateGroups.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : CustomScrollView(
                  controller: _scrollController,
                  slivers: [
                    for (final group in _dateGroups) ...[
                      _buildDateHeader(group),
                      _buildPhotoGrid(group),
                    ],
                    if (_loading)
                      const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                      ),
                  ],
                ),
          bottomNavigationBar: _buildBottomBar(),
        ),
        // 全选预加载时的全屏遮罩，防止用户重复操作
        if (_isSelectAllLoading) ...
          const [
            ModalBarrier(dismissible: false, color: Colors.black26),
            Center(child: CircularProgressIndicator()),
          ],
      ],
    );
  }

  /// 日期分组标题行
  SliverToBoxAdapter _buildDateHeader(_DateGroup group) {
    final allSelected = group.assets.every((a) => _selectedIds.contains(a.id));
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(
          children: [
            Text(
              group.date,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            GestureDetector(
              onTap: _isSelectAllLoading ? null : () => _toggleDateGroup(group),
              child: Text(
                allSelected ? '取消' : '全选',
                style: const TextStyle(fontSize: 13, color: Colors.blue),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// 照片网格（3 列）
  SliverGrid _buildPhotoGrid(_DateGroup group) {
    return SliverGrid(
      delegate: SliverChildBuilderDelegate(
        (ctx, i) => _buildPhotoCell(group.assets[i]),
        childCount: group.assets.length,
      ),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        mainAxisSpacing: 2,
        crossAxisSpacing: 2,
      ),
    );
  }

  /// 单张照片缩略图（含勾选角标）
  Widget _buildPhotoCell(AssetEntity asset) {
    final isSelected = _selectedIds.contains(asset.id);
    final index = isSelected ? _selectedList.indexWhere((a) => a.id == asset.id) + 1 : 0;

    return GestureDetector(
      onTap: () => _toggleAsset(asset),
      child: Stack(
        fit: StackFit.expand,
        children: [
          FutureBuilder<Uint8List?>(
            future: _thumbnailCache.putIfAbsent(
              asset.id,
              () => asset.thumbnailData,
            ),
            builder: (_, snap) {
              if (snap.connectionState != ConnectionState.done || snap.data == null) {
                return const ColoredBox(color: Color(0xFFE0E0E0));
              }
              return Image.memory(snap.data!, fit: BoxFit.cover);
            },
          ),
          // 选中遮罩
          if (isSelected)
            Container(
              color: Colors.blue.withOpacity(0.25),
            ),
          // 右上角勾选角标
          Positioned(
            top: 4,
            right: 4,
            child: Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? Colors.blue : Colors.transparent,
                border: Border.all(
                  color: isSelected ? Colors.blue : Colors.white,
                  width: 1.5,
                ),
              ),
              child: isSelected
                  ? Center(
                      child: Text(
                        '$index',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  : null,
            ),
          ),
        ],
      ),
    );
  }

  /// 底部确认栏
  Widget _buildBottomBar() {
    final count = _selectedList.length;
    final total = _totalCount > 0 ? '$_totalCount' : '--';
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _isSelectAllLoading ? null : _onConfirm,
            child: Text('确认 $count/$total'),
          ),
        ),
      ),
    );
  }
}

/// 日期分组数据模型
class _DateGroup {
  final String date;
  final List<AssetEntity> assets;

  _DateGroup({required this.date, required this.assets});
}
