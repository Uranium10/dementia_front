import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, ExternalLink, Calendar } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { supabase } from '../lib/supabaseClient';

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPost() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setPost(data);
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (id) fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">게시글을 찾을 수 없습니다</h2>
        <button 
          onClick={() => navigate('/prevention')}
          className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  const formattedDate = new Date(post.published_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="max-w-3xl mx-auto bg-white min-h-screen shadow-sm relative">
        
        {/* 상단 네비게이션 바 */}
        <div className="sticky top-20 bg-white/80 backdrop-blur-md z-40 border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">뒤로</span>
          </button>
        </div>

        {/* 썸네일 이미지 */}
        {post.thumbnail_url && (
          <div className="w-full aspect-[21/9] bg-slate-100 overflow-hidden">
            <img 
              src={post.thumbnail_url} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 본문 컨테이너 */}
        <div className="p-6 md:p-10">
          
          {/* 헤더 (카테고리, 제목, 메타정보) */}
          <div className="mb-10 space-y-4">
            <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full">
              {post.category}
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium pt-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> {formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" /> {post.read_minutes}분 읽기
              </span>
            </div>
          </div>

          {/* 마크다운 본문 렌더링 */}
          <div className="prose prose-lg prose-slate max-w-none mb-12 prose-headings:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700">
            <ReactMarkdown 
              rehypePlugins={[rehypeRaw]}
              components={{
                img: ({ node, ...props }) => (
                  <img 
                    {...props} 
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    style={{ maxWidth: '100%', height: 'auto', ...props.style }}
                  />
                )
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>

          {/* 출처 정보 */}
          {post.source && post.source.org && (
            <div className="mt-12 pt-6 border-t border-slate-200 bg-slate-50 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-700 mb-2">출처 및 참고자료</h3>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-medium">{post.source.org}</span>
                {post.source.url && (
                  <a 
                    href={post.source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium ml-2"
                  >
                    원문 보기 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
