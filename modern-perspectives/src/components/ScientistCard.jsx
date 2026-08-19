import { useState } from 'react';
import Border from './Border';
import LikeButton from './LikeButton';
import CommentsModal from './CommentsModal';
import ShareModal from "./ShareModal";
import "./ScientistCard.css";

export default function ScientistCard({ scientist }) {
  const [flipped, setFlipped] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <div 
      className="card-scene" 
      onClick={() => setFlipped((f) => !f)} 
      role="button" 
      aria-pressed={flipped}
    >
      <div className={`card-inner${flipped ? ' flipped' : ''}`}>
        {/* Front */}
        <div className="card-front">
          <img 
            src={scientist.img} 
            alt={scientist.name} 
            title={scientist.bio} 
            loading="lazy"
          />
          <article>
            <h3 style={{ marginTop: '2%', color: '#000000' }}>
              {scientist.name}
              <br />({scientist.years})
            </h3>
            <p className="p">
              <q>{scientist.quote}</q>
            </p>
          </article>
        </div>

        {/* Back */}
        <div className="card-back">
          <p
            className="text-center"
            style={{
              WebkitTextStroke: '0px black',
              textShadow: '0px 0px 0px #000000',
              marginTop: '20%',
              padding: '10px',
            }}
          >
            {scientist.bio}
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
            <LikeButton targetType="scientist" targetId={scientist.id} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCommentsOpen(true);
              }}
              aria-label="Open comments"
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
              onClick={(e) => { 
                e.stopPropagation(); 
                setShareOpen(true); 
              }}
              aria-label="Open share modal"
              style={{ 
                background:'none', 
                border:'none', 
                cursor:'pointer', 
                fontFamily:'inherit', 
                fontSize:13, 
                color:'#1a1a1a', 
                textDecoration:'underline', 
                padding:0 
              }}
            >
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      {/* Comments Modal */}
      <CommentsModal
        targetType="scientist"
        targetId={scientist.id}
        title={scientist.name}
        isOwner={false}
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />

      {/* Share Modal with full props */}
      <ShareModal 
        post={{
          id: scientist.id,
          author_name: scientist.name,
          bio: scientist.bio,
          quote: scientist.quote,
          img: scientist.img,
        }} 
        open={shareOpen} 
        onClose={() => setShareOpen(false)} 
      />
    </div>
  );
}
