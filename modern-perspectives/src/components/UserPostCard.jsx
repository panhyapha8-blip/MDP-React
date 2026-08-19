import { useState } from 'react';
import Border from './Border';
import LikeButton from './LikeButton';
import CommentsModal from './CommentsModal';
import { useAuthContext } from '../context/AuthContext';
import ShareModal from "./ShareModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export default function UserPostCard({ post }) {
  const { user } = useAuthContext();
  const [flipped, setFlipped] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const imageUrl = post.image_url?.startsWith('http')
    ? post.image_url
    : `${API_BASE}${post.image_url}`;

  const frontStyle = flipped
    ? { position: 'absolute', top: 0, left: 0, width: '100%' }
    : undefined;
  const backStyle = flipped ? { position: 'static' } : undefined;

  const isOwner = !!(user?.email && post.owner_email && user.email === post.owner_email);

  return (
    <div className="card-scene" onClick={() => setFlipped((f) => !f)}>
      <div className={`card-inner${flipped ? ' flipped' : ''}`}>
        <div className="card-front" style={frontStyle}>
          <img src={imageUrl} alt={post.author_name} title={post.slogan} />
          <article>
            <h3 style={{ marginTop: '2%', color: '#000000' }}>{post.author_name}</h3>
            <p className="p">
              <q>{post.slogan}</q>
            </p>
          </article>
        </div>

        <div className="card-back" style={backStyle}>
          <p
            className="text-center"
            style={{
              WebkitTextStroke: '0px black',
              textShadow: '0px 0px 0px #000000',
              marginTop: '20%',
              padding: '10px',
            }}
          >
            {post.description}
          </p>

          <Border />

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
              paddingBottom: 14,
              color: '#1a1a1a',
            }}
          >
            <LikeButton targetType="post" targetId={post.id} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCommentsOpen(true);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 13,
                color: '#1a1a1a',
                textDecoration: 'underline',
                padding: 0,
              }}
            >
              💬 Comment
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
              style={{ background:'none', border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:13, color:'#1a1a1a', textDecoration:'underline', padding:0 }}
            >
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      <CommentsModal
        targetType="post"
        targetId={post.id}
        title={post.author_name}
        isOwner={isOwner}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
      <ShareModal 
        post={post} 
        open={shareOpen} 
        onClose={() => setShareOpen(false)} 
      />
      
    </div>
  );
}