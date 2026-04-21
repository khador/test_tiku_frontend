import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './router/AuthGuard';
import Login from './views/Login';
import AdminLayout from './layout/AdminLayout';
import StudentLayout from './layout/StudentLayout'; // 引入学生布局
import Practice from './views/student/Practice';    // 引入刷题页面
import ErrorBook from './views/student/ErrorBook';
import Dashboard from './views/student/Dashboard';
import TeacherDashboard from './views/teacher/TeacherDashboard';

// 【新增这行】：引入我们准备好的班级管理页面
import ClassManage from './views/admin/ClassManage';

// 保留其他临时占位组件...
const TeacherManage = () => <div style={{ padding: 24 }}><h2>教师管理表格 (开发中)</h2></div>;
const StudentManage = () => <div style={{ padding: 24 }}><h2>学生管理表格 (开发中)</h2></div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 管理员专属路由群 (PC端) */}
        <Route element={<AuthGuard allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            {/* 【修改1】：管理员登录后，默认跳转到班级管理页 */}
            <Route path="dashboard" element={<Navigate to="/admin/classes" replace />} />

            <Route path="teachers" element={<TeacherManage />} />
            <Route path="students" element={<StudentManage />} />

            {/* 【修改2】：把这里占位的 <h2> 换成真实的 ClassManage 组件 */}
            <Route path="classes" element={<ClassManage />} />
          </Route>
        </Route>

        {/* 教师专属路由群 (PC端) */}
        <Route element={<AuthGuard allowedRole="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* 学生专属路由群 (Pad端) */}
        <Route element={<AuthGuard allowedRole="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            {/* 修正：访问 /student 时重定向到 dashboard */}
            <Route index element={<Navigate to="/student/dashboard" replace />} />

            {/* 确保这里的 path 和 StudentLayout 里的 tabs key 对应 */}
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="practice" element={<Practice />} />
            <Route path="error-book" element={<ErrorBook />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;