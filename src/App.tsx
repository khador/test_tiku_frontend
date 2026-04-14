import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './router/AuthGuard';
import Login from './views/Login';
import AdminLayout from './layout/AdminLayout';
import StudentLayout from './layout/StudentLayout'; // 引入学生布局
import Practice from './views/student/Practice';    // 引入刷题页面

// 保留其他临时占位组件...
const TeacherDashboard = () => <div>教师工作台 (PC)</div>;
const StudentDashboard = () => <div>学生工作台首页 (Pad)</div>;
const ErrorBook = () => <div>错题本 (Pad)</div>;
const TeacherManage = () => <h2>这里是教师管理表格</h2>;
const StudentManage = () => <h2>这里是学生管理表格</h2>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 管理员专属路由群 */}
        <Route element={<AuthGuard allowedRole="admin" />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<Navigate to="/admin/teachers" replace />} />
            <Route path="teachers" element={<TeacherManage />} />
            <Route path="students" element={<StudentManage />} />
            <Route path="classes" element={<h2>这里是班级配置</h2>} />
          </Route>
        </Route>

        <Route element={<AuthGuard allowedRole="teacher" />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        </Route>

        {/* 学生专属路由群 (Pad端) */}
        <Route element={<AuthGuard allowedRole="student" />}>
          <Route path="/student" element={<StudentLayout />}>
            {/* 默认跳转到刷题页，或者 dashboard */}
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="practice" element={<Practice />} />
            <Route path="error-book" element={<ErrorBook />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;