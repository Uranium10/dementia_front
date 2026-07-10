import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Brain } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">


      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:p-10">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-200 text-slate-700 leading-loose">
          <h2 className="text-3xl font-extrabold text-slate-800 mb-8 pb-4 border-b border-slate-200">
            치매정보알리미 개인정보 처리방침
          </h2>
          
          <div className="space-y-10">
            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-4">제1조 (개인정보의 처리 목적)</h3>
              <p>
                치매정보알리미는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 사전 동의를 구하는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-slate-600">
                <li>AI 기반 치매 초기 증상 분석 및 맞춤형 상담 제공</li>
                <li>사용자의 위치 기반 인근 치매안심센터 추천 서비스 (그래프 DB 활용)</li>
                <li>서비스 품질 향상을 위한 대화 내역 임시 저장 (Vector DB 분석용)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-4">제2조 (처리하는 개인정보의 항목)</h3>
              <p>본 서비스는 별도의 회원가입 없이 익명으로 이용할 수 있으며, 상담 과정에서 사용자가 자발적으로 입력하는 다음의 정보만을 수집합니다.</p>
              <ul className="list-disc pl-5 mt-3 space-y-2 text-sm text-slate-600">
                <li><strong>수집 항목:</strong> 연령대, 성별, 주요 증상, 관심 거주 지역(시/구 단위)</li>
                <li><strong>수집 방법:</strong> AI 챗봇과의 대화 입력창을 통한 수집</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-4">제3조 (개인정보의 파기)</h3>
              <p>
                본 프로토타입 시스템은 세션 종료 시(브라우저를 닫을 때) 대화 내역 및 입력된 위치 정보를 즉시 파기하며, 어떠한 개인 식별 정보도 서버에 영구 저장하지 않습니다.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-bold text-slate-800 mb-4">부칙</h3>
              <p className="text-sm text-slate-500">
                본 개인정보 처리방침은 2026년 7월 9일부터 적용됩니다. (본 문서는 포트폴리오 프로토타입용 더미 텍스트입니다.)
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Brain className="w-4 h-4 text-slate-300" />
          <span>© 2026 치매정보알리미. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
