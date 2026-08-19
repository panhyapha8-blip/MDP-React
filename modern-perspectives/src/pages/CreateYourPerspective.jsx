// src/pages/CreateYourPerspective.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreatePost from "../components/CreatePost";
import PostGallery from "../components/PostGallery";
import "./CreateYourPerspective.css";

export default function CreateYourPerspective() {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingPost, setEditingPost] = useState(null);

  const handlePostSaved = () => {
    setRefreshTrigger((n) => n + 1);
    setEditingPost(null); // back to create mode
  };

  return (
    <div className="cyp-page">
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Home
      </button>

      <CreatePost
        key={editingPost?.id ?? "new"}
        onPostCreated={handlePostSaved}
        editingPost={editingPost}
      />

      <PostGallery
        refreshTrigger={refreshTrigger}
        onEditPost={setEditingPost}
      />
    </div>
  );
}