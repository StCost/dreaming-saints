import { lazy } from "react";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogPost = lazy(() => import("./pages/BlogPost"));

const App = () => (
  <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <div className="container">
      <Routes>
        <Route path="/" element={<BlogList />} />
        <Route path="/:filename" element={<BlogPost />} />
      </Routes>
    </div>
  </Router>
);

export default App;
