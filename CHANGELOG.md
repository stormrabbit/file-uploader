# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [1.0.0] - 2026-06-23

### Added

- PC 端图片网格预览 + Element Plus 灯箱大图浏览
- PC 端局域网二维码展示，手机扫码直达上传页
- PC 端批量删除、一键清空文件
- Mobile 端串行上传队列（并发数 = 1），逐张进度反馈
- Mobile 端三段式状态机（idle → uploading → done）
- Flutter WebView 上传桥接，支持 JavaScript Channel 调用原生选图器
- 客户端 MD5 秒传去重（SparkMD5 分块计算）
- 动态 API baseURL 初始化，自动适配局域网 IP
- Vite MPA 多页应用结构，PC 和 Mobile 完全隔离

### Fixed

- 修复 `delay.ts` 使用 `setInterval` 模拟延迟导致的计时误差，改为 `setTimeout`
- 修复 `size.ts` 使用 `window.onresize` 赋值覆盖全局监听器，改为 `addEventListener` + `onUnmounted` 移除
