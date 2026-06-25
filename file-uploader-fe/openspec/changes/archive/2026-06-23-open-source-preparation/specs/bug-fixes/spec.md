## ADDED Requirements

### Requirement: 修复 delay.ts 使用 setInterval 实现延迟
`src/utils/delay.ts` 中的 `delay()` 函数 SHALL 使用 `setTimeout` 实现，与同文件的 `delayByMillisecond` 保持一致，消除 `setInterval` 计数误差。

#### Scenario: delay 函数按预期时间 resolve
- **WHEN** 调用 `delay(2)`（延迟 2 秒）
- **THEN** Promise 在约 2000ms 后 resolve，误差不超过 100ms

### Requirement: 修复 size.ts window.onresize 覆盖问题
`src/compostions/size.ts` SHALL 使用 `window.addEventListener('resize', fn)` 注册监听器，并在 `onUnmounted` 钩子中调用 `window.removeEventListener('resize', fn)` 移除，避免覆盖其他监听器和内存泄漏。

#### Scenario: 多个组件共用 resize 监听不互相覆盖
- **WHEN** 同一页面同时挂载多个使用 `useWindowSize` 的组件
- **THEN** 所有组件都能正确响应窗口大小变化，无监听器被覆盖

#### Scenario: 组件卸载时移除监听器
- **WHEN** 使用了 `useWindowSize` 的组件被卸载（`onUnmounted`）
- **THEN** 对应的 resize 监听器被移除，无内存泄漏
