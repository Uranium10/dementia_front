import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const POSTS_PER_PAGE = 10;

export default function PostListPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts(currentPage);
  }, [currentPage]);

  const fetchPosts = async (page) => {
    setLoading(true);
    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE - 1;

    try {
      const { data, error, count } = await supabase
        .from('posts')
        .select('id, title, category, summary, thumbnail_url, created_at, read_minutes, is_featured', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;
      setPosts(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" /> 돌아가기
        </button>

        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 tracking-tight">예방 정보 전체보기</h1>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map(post => (
              <div 
                key={post.id}
                onClick={() => navigate(`/post/${post.id}`)}
                className="bg-white rounded-3xl p-5 md:p-6 flex flex-col md:flex-row gap-5 md:gap-6 items-start cursor-pointer hover:shadow-xl shadow-sm border border-slate-100 transition-all duration-300 group"
              >
                {post.thumbnail_url && (
                  <div className="w-full md:w-56 h-48 md:h-36 bg-slate-100 rounded-2xl overflow-hidden shrink-0 relative">
                    <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                )}
                <div className="flex-1 flex flex-col justify-center py-2">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg">{post.category}</span>
                    {post.is_featured && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">추천</span>}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors leading-snug">{post.title}</h2>
                  {post.summary && <p className="text-slate-500 text-sm mb-4 line-clamp-2 leading-relaxed">{post.summary}</p>}
                  
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 mt-auto">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    {post.read_minutes && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {post.read_minutes}분 소요
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {posts.length === 0 && (
              <div className="text-center py-32 bg-white rounded-3xl border border-slate-100">
                <p className="text-slate-500 font-medium">등록된 게시글이 없습니다.</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-16">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-11 h-11 rounded-xl font-bold transition-all duration-200 ${currentPage === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-110' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
