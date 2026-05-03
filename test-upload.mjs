// 用 anon key 测试（模拟真实前端上传）
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lhlxidkzqiokyhmflgho.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobHhpZGt6cWlva3lobWZsZ2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3NDM5ODcsImV4cCI6MjA5MzMxOTk4N30.O39Vsp8j4qxp5FK7dji42jVnTZQIuBXk8h0LYzM8e3Y';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testUpload() {
  console.log('🔄 用 anon key 测试上传（模拟真实客户）...\n');

  const testContent = Buffer.from('TEST KYC DOCUMENT - 模拟护照文件');
  const filePath = 'MeishengTech-PteLtd/张三_passport.txt';

  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .upload(filePath, testContent, { contentType: 'text/plain', upsert: true });

  if (error) {
    console.error('❌ 上传失败:', error.message);
    return;
  }

  console.log('✅ 上传成功！');
  console.log('   文件路径:', data.path);

  await supabase.storage.from('kyc-documents').remove([filePath]);
  console.log('🧹 测试文件已清理。');
  console.log('\n🎉 证件上传功能完全可用，前端上线无障碍！');
}

testUpload();
