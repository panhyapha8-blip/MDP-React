import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from '../components/Header';

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // ស្វែងរកនៅពេល query ផ្លាស់ប្តូរ
  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    setLoading(true);

    // ============================================
    // នៅទីនេះអ្នកត្រូវដាក់ logic ស្វែងរកពិតប្រាកដ
    // ឧទាហរណ៍៖ ទាញទិន្នន័យពី API ឬ filter ពី array
    // ============================================
    
    // សម្រាប់ឥឡូវនេះ ខ្ញុំដាក់ dummy data ជាឧទាហរណ៍
    const dummyData = [
      { id: 1, title: 'Albert Einstein', type: 'Scientist', description: 'Theory of Relativity' },
      { id: 2, title: 'Marie Curie', type: 'Scientist', description: 'Radioactivity research' },
      { id: 3, title: 'Steve Jobs', type: 'Perspective', description: 'Stay hungry, stay foolish' },
      { id: 4, title: 'Buddha', type: 'Perspective', description: 'The mind is everything' },
      { id: 5, title: 'Isaac Newton', type: 'Scientist', description: 'Laws of Motion' },
    ];

    // Filter តាម query
    const filtered = dummyData.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.type.toLowerCase().includes(query.toLowerCase())
    );

    // Simulate loading
    setTimeout(() => {
      setResults(filtered);
      setLoading(false);
    }, 400);

  }, [query]);

  return (
    <>
      <Header />

      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 20px' }}>
        {/* Search Header */}
        <div style={{ marginBottom: 30 }}>
          <h1 style={{ color: '#ffe88a', fontSize: 28, marginBottom: 8 }}>
            Search Results
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>
            {query ? (
              <>Results for: <strong style={{ color: '#d4af37' }}>"{query}"</strong></>
            ) : (
              'Please enter a search term'
            )}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <p style={{ color: '#d4af37', textAlign: 'center' }}>Searching...</p>
        )}

        {/* No results */}
        {!loading && query && results.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 16,
            border: '1px solid rgba(212,175,55,0.2)'
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18 }}>
              No results found for "{query}"
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: 20,
                padding: '10px 24px',
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(90deg, #d4af37, #ffe88a)',
                color: '#06121f',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Back to Home
            </button>
          </div>
        )}

        {/* Results List */}
        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {results.map(item => (
              <div
                key={item.id}
                style={{
                  padding: '20px 24px',
                  background: 'rgba(6, 18, 31, 0.6)',
                  borderRadius: 16,
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ color: '#ffe88a', margin: 0, fontSize: 18 }}>
                    {item.title}
                  </h3>
                  <span style={{
                    fontSize: 12,
                    padding: '4px 12px',
                    borderRadius: 999,
                    background: 'rgba(212,175,55,0.15)',
                    color: '#d4af37'
                  }}>
                    {item.type}
                  </span>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', margin: '8px 0 0 0' }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Back button */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '12px 28px',
              borderRadius: 999,
              border: '1px solid rgba(212,175,55,0.5)',
              background: 'transparent',
              color: '#d4af37',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </>
  );
}
