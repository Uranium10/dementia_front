import React from 'react';
import { ExternalLink, Database, BookOpen, ShieldAlert, FileText, HeartPulse } from 'lucide-react';

export default function ReferencePage() {
  const references = [
    {
      title: "치매안심센터 치매조기검진사업",
      desc: "중앙치매센터에서 제공하는 국가 치매조기검진사업에 대한 공식 안내입니다. 검진 대상 및 절차를 확인할 수 있습니다.",
      url: "https://ansim.nid.or.kr/introduce/early_service.aspx",
      org: "중앙치매센터",
      icon: <Database className="w-6 h-6 text-blue-500" />
    },
    {
      title: "보건복지부 치매조기검진사업",
      desc: "보건복지부의 치매 조기 진단 지원 정책과 치매 환자 및 가족을 위한 복지 지원 내용입니다.",
      url: "https://www.mohw.go.kr/menu.es?mid=a10712010100",
      org: "보건복지부",
      icon: <FileText className="w-6 h-6 text-indigo-500" />
    },
    {
      title: "찾기쉬운 생활법령 정보",
      desc: "치매 환자와 그 가족들이 실생활에서 참고할 수 있는 법률적 지원 및 제도 안내입니다.",
      url: "https://www.easylaw.go.kr/CSP/OnhunqueansInfoRetrieve.laf?onhunqnaAstSeq=97&onhunqueSeq=4461",
      org: "법제처",
      icon: <BookOpen className="w-6 h-6 text-amber-500" />
    },
    {
      title: "국가정신건강정보포털 - 치매",
      desc: "치매의 원인, 증상, 진단, 치료 및 예방법, 돌봄 방법 등에 대한 전반적인 정보를 제공합니다.",
      url: "https://www.mentalhealth.go.kr/portal/disease/diseaseDetail.do?dissId=22",
      org: "국가정신건강정보포털",
      icon: <HeartPulse className="w-6 h-6 text-rose-500" />
    },
    {
      title: "중앙치매센터 치매사전",
      desc: "치매와 관련된 전문 용어와 의학적 지식을 알기 쉽게 설명해 주는 공식 백과사전입니다.",
      url: "https://www.nid.or.kr/info/diction_list5.aspx?gubun=0506",
      org: "중앙치매센터",
      icon: <BookOpen className="w-6 h-6 text-teal-500" />
    },
    {
      title: "치매 바로 알기",
      desc: "파주시보건소에서 안내하는 치매 원인, 증상 및 단계별 특징에 대한 지역 보건 정보입니다.",
      url: "https://clinic.paju.go.kr/clinic/clinic_03/clinic_03_14/clinic_03_14_02.jsp",
      org: "파주시보건소",
      icon: <ShieldAlert className="w-6 h-6 text-emerald-500" />
    },
    {
      title: "국가건강정보포털 - 치매",
      desc: "질병관리청에서 제공하는 치매에 대한 전반적인 건강 정보 및 올바른 관리 방안입니다.",
      url: "https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6261",
      org: "질병관리청",
      icon: <ShieldAlert className="w-6 h-6 text-green-500" />
    }
  ];

  return (
    <main className="w-full min-h-screen bg-slate-50 flex flex-col items-center py-20 px-4">
      <div className="max-w-5xl w-full">
        {/* 헤더 섹션 */}
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-blue-600 tracking-wider uppercase mb-3">Data Sources & References</h2>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-6 tracking-tight">데이터 출처 및 참고자료</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            본 서비스에서 활용된 치매 예방 가이드라인 및 관련 데이터의 <strong className="text-slate-700">공식 출처</strong>입니다.<br />
            신뢰할 수 있는 국가 기관과 대형 병원의 검증된 자료만을 바탕으로 합니다.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {references.map((ref, idx) => (
            <a
              key={idx}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
            >
              {/* 장식용 그라데이션 백그라운드 */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-300">
                  {ref.icon}
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wide">{ref.org}</span>
                  <h3 className="text-lg font-bold text-slate-800 mt-0.5 line-clamp-1">{ref.title}</h3>
                </div>
              </div>

              <p className="text-slate-500 text-sm leading-relaxed flex-grow">
                {ref.desc}
              </p>

              <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors flex items-center">
                  원문 확인하기
                </span>
                <div className="bg-slate-50 p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* 면책/안내 문구 */}
        <div className="mt-16 p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-3 bg-red-50 rounded-2xl shrink-0">
            <ShieldAlert className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-2">서비스 이용 안내 (면책 조항)</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              본 서비스는 사용자에게 편리한 정보를 제공할 목적으로 제작된 참고용 서비스이며, 어떠한 경우에도 <strong>전문의의 의학적 진단을 대신할 수 없습니다.</strong>
              자가진단 결과나 제공된 정보만을 바탕으로 임의의 의학적 결정을 내리지 마시고, 정확한 진단과 치료를 위해서는 반드시 가까운 치매안심센터나 전문 의료기관을 방문하시기 바랍니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
