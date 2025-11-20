#!/bin/bash
# Monitor Hallo3 model download progress

echo "🔍 Checking Hallo3 model download status..."
echo ""

ssh -p 38430 root@85.218.235.6 "
  echo '📊 Disk usage:'
  du -sh /root/hallo2_models 2>/dev/null || echo 'No data yet'
  echo ''
  
  echo '📁 Files downloaded:'
  ls /root/hallo2_models 2>/dev/null | wc -l
  echo ''
  
  echo '📝 Recent log entries:'
  tail -10 /tmp/hallo_download.log 2>/dev/null || echo 'No logs yet'
  echo ''
  
  echo '💾 Available disk space:'
  df -h / | grep -E 'Filesystem|/'
"
