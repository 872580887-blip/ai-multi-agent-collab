#!/usr/bin/env node

/**
 * Kiro IDE RPA 通知器
 * 功能：监听 .kiro-chat-messages/ → 解析 JSON → 在 Kiro IDE 中发送通知消息
 * 启动：node kiro-notifier.js
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MESSAGE_DIR = '/Users/mac/Desktop/是/.kiro-chat-messages';
const LOG_FILE = 'kiro-notifier.log';

// 日志函数
function log(msg) {
  const time = new Date().toISOString();
  const line = `[${time}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line);
  console.log(line.trim());
}

// 聚焦 Kiro IDE 并输入消息（使用剪贴板避免特殊字符问题）
function sendToKiro(sender, message) {
  const formatted = `📬 新消息来自【${sender}】：${message}\n\n回复请用：curl -X POST http://localhost:8767/api/kiro/send -H 'Content-Type: application/json' -d '{"message":"你的回复内容"}'`;
  
  // Step 1: 将消息写入剪贴板
  exec(`printf '%s' ${JSON.stringify(formatted)} | pbcopy`, (err) => {
    if (err) {
      log(`⚠️ 写入剪贴板失败: ${err.message}`);
      return;
    }
    
    // Step 2: 激活 Kiro IDE
    exec('osascript -e \'tell application "Kiro" to activate\'', (err) => {
      if (err) {
        log(`⚠️ 激活 Kiro IDE 失败: ${err.message}`);
        return;
      }
      
      // Step 3: 等待 0.3 秒确保窗口就绪
      setTimeout(() => {
        // Step 4: 粘贴文本（Cmd+V）
        exec('osascript -e \'tell application "System Events" to keystroke "v" using command down\'', (err) => {
          if (err) {
            log(`⚠️ 粘贴文本失败: ${err.message}`);
            return;
          }
          
          // Step 5: 等待 0.1 秒后按回车发送
          setTimeout(() => {
            exec('osascript -e \'tell application "System Events" to key code 36\'', (err) => {
              if (err) {
                log(`⚠️ 按回车失败: ${err.message}`);
                return;
              }
              log(`✅ 已在 Kiro IDE 发送通知: ${formatted.substring(0, 100)}...`);
            });
          }, 100);
        });
      }, 300);
    });
  });
}

// 处理单个 JSON 文件
function processFile(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);
    
    const sender = data.sender || 'unknown';
    const msg = data.message || '';
    
    log(`🔍 处理文件: ${path.basename(filepath)} | 发送者: ${sender}`);
    sendToKiro(sender, msg);
    
    // 成功后删除文件
    fs.unlinkSync(filepath);
    log(`🗑️ 已删除已处理文件: ${path.basename(filepath)}`);
    
  } catch (err) {
    log(`❌ 处理文件失败 ${filepath}: ${err.message}`);
  }
}

// 主监听逻辑（使用 fswatch）
function startListening() {
  log('🚀 Kiro RPA 通知器启动中...');
  
  // 检查 fswatch 是否存在
  exec('which fswatch', (err) => {
    if (err) {
      log('❌ 错误: 未找到 fswatch。请先安装：brew install fswatch');
      process.exit(1);
    }
    
    // 启动 fswatch 监听
    const fswatch = spawn('fswatch', ['-o', MESSAGE_DIR]);
    
    fswatch.stdout.on('data', () => {
      // fswatch 触发：扫描目录找最新 .json
      try {
        const files = fs.readdirSync(MESSAGE_DIR)
          .filter(f => f.endsWith('.json'))
          .map(f => path.join(MESSAGE_DIR, f))
          .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        
        if (files.length > 0) {
          processFile(files[0]); // 处理最新一个
        }
      } catch (err) {
        log(`📁 目录扫描失败: ${err.message}`);
      }
    });
    
    fswatch.stderr.on('data', (data) => {
      log(`fswatch 错误: ${data.toString()}`);
    });
    
    fswatch.on('close', (code) => {
      log(`fswatch 进程退出，代码 ${code}`);
    });
  });
}

// 启动
startListening();
