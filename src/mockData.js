// Mock database for Vector DB and Graph DB
// Used for simulating RAG and Graph Traversal in dementia_front

// 1. Vector Database mock chunks (from PDF documents)
export const vectorDB = [
  {
    id: "chunk_01",
    document: "중앙치매센터 치매가이드북 (2025)",
    page: 12,
    topic: "초기 증상",
    content: "치매의 초기 증상 중 가장 대표적인 것은 기억력 감퇴입니다. 특히 최근에 일어난 일을 기억하지 못하는 단기 기억력 장애가 먼저 나타나며, 옛날 기억은 비교적 오랫동안 잘 유지되는 특징이 있습니다. 전화번호나 사람 이름을 자주 잊어버리거나 같은 질문을 반복하는 행동이 나타나면 의심해볼 수 있습니다.",
    keywords: ["초기", "증상", "기억력", "감퇴", "기억", "장애"]
  },
  {
    id: "chunk_02",
    document: "중앙치매센터 치매가이드북 (2025)",
    page: 15,
    topic: "언어장애 및 인지 능력",
    content: "초기부터 중기로 넘어가면서 단어가 잘 생각이 나지 않아 말수가 줄어들거나 말문이 막히는 언어장애가 동반될 수 있습니다. 대화 중 적절한 단어를 찾기 어려워 '그것', '저것' 같은 대명사 표현을 주로 쓰고 대화를 이어가는 데 지장이 생깁니다. 시간이나 장소를 혼동하는 지남력 저하 현상도 시작됩니다.",
    keywords: ["언어", "장애", "단어", "대화", "지남력", "혼동"]
  },
  {
    id: "chunk_03",
    document: "보건복지부 치매생활안내서",
    page: 45,
    topic: "생활 습관 및 식사 예방",
    content: "치매 예방을 위해서는 올바른 식습관이 매우 중요합니다. 지중해식 식단이 권장되며, 신선한 채소와 과일, 등푸른 생선, 견과류를 꾸준히 섭취하는 것이 뇌혈관 건강에 도움을 줍니다. 과도한 염분 섭취와 포화지방은 피하고 오메가-3와 비타민 E 성분이 풍부한 음식을 정기적으로 먹는 습관을 들여야 합니다.",
    keywords: ["예방", "식단", "식사", "음식", "채소", "뇌혈관"]
  },
  {
    id: "chunk_04",
    document: "국가건영정보포털 치매예방수칙",
    page: 8,
    topic: "신체 운동 및 인지 훈련",
    content: "신체 활동은 치매 위험률을 낮추는 가장 확실한 예방법 중 하나입니다. 주 3회 이상, 매회 30분 이상의 유산소 운동(걷기, 조깅, 자전거 등)은 뇌 세포의 활성화를 도우며 혈류량을 촉진합니다. 이와 병행하여 독서, 바둑, 악기 배우기 등의 지속적인 두뇌 학습 활동을 하면 인지 예비능(Cognitive Reserve)이 강화됩니다.",
    keywords: ["예방", "운동", "신체", "활동", "훈련", "인지"]
  },
  {
    id: "chunk_05",
    document: "치매정책 사업안내서 (500p)",
    page: 112,
    topic: "가족 지원 및 돌봄 제도",
    content: "치매 환자 가족을 위한 국가 정책으로는 치매가족 휴가제와 장기요양보험제도가 있습니다. 치매가족 휴가제는 환자를 돌보는 가족에게 일시적으로 휴식을 주기 위해 연간 일정 일수 동안 단기보호 서비스를 지원하는 제도입니다. 또한 치매안심센터에서는 가족 힐링 프로그램 및 자조모임 공간을 제공하고 있습니다.",
    keywords: ["가족", "지원", "제도", "정책", "휴가제", "안심센터"]
  },
  {
    id: "chunk_06",
    document: "중앙치매센터 치매가족교재 '헤아림'",
    page: 34,
    topic: "초기 치매 대처 및 소통",
    content: "초기 치매 환자와 대화할 때는 화를 내거나 윽박지르지 말고 차분하고 명확하게 소통해야 합니다. 환자의 실수를 꾸짖기보다는 환자의 감정을 이해하고 공감해주는 것이 필수적입니다. 한번에 한 가지씩 쉬운 단어를 사용하여 질문하고 대답을 생각할 충분한 시간(최소 10초 이상)을 기다려주는 것이 정서적 안정에 기여합니다.",
    keywords: ["대화", "소통", "환자", "가족", "공감", "안정"]
  },
  {
    id: "chunk_07",
    document: "요양보호사 교육자료 (2024)",
    page: 78,
    topic: "중기 치매 환자 케어",
    content: "중기 치매 환자의 경우 일상생활(옷 입기, 목욕 등)에 부분적인 도움을 필요로 합니다. 이때 행동 변화 대처법이 핵심적입니다. 환자가 망상이나 환청을 겪거나 의심 증세를 보일 경우, 즉각 반박하기보다는 '불안하시겠어요'라며 안심시킨 뒤 환자가 좋아하는 다른 화제나 행동으로 자연스럽게 유도(환기 기법)하는 것이 좋습니다.",
    keywords: ["중기", "케어", "망상", "의심", "대처", "목욕"]
  },
  {
    id: "chunk_08",
    document: "요양보호사 교육자료 (2024)",
    page: 92,
    topic: "말기 치매 환자 대처",
    content: "말기 치매 환자는 의사소통 능력이 현저히 감소하며 대소변 조절이나 식사 섭취를 전적으로 타인에게 의존하게 됩니다. 대화가 통하지 않더라도 비언어적 의사소통(손잡아주기, 눈맞춤, 부드러운 목소리 톤)을 통해 안정감을 주어야 합니다. 피부 욕창 예방을 위해 매 2시간마다 체위를 변경해주는 등의 물리적인 위생 및 안전 관리가 극히 중요해집니다.",
    keywords: ["말기", "위생", "안전", "의사소통", "욕창", "체위"]
  }
];

// 2. Graph Database mock database (Nodes and Edges)
// Includes Regions, Centers, Services, Symptoms, Stages, CareMethods
export const graphDB = {
  nodes: [
    // Regions
    { id: "reg_01", label: "서울시 강남구", type: "Region", color: "#3b82f6" },
    { id: "reg_02", label: "서울시 서초구", type: "Region", color: "#3b82f6" },
    { id: "reg_03", label: "경기도 성남시", type: "Region", color: "#3b82f6" },
    
    // Centers
    { id: "cnt_01", label: "강남구 치매안심센터", type: "Center", color: "#2563eb", address: "서울시 강남구 학동로 426", tel: "02-567-8901", manager: "김수현 팀장" },
    { id: "cnt_02", label: "서초구 치매안심센터", type: "Center", color: "#2563eb", address: "서울시 서초구 서초로 115", tel: "02-2155-7080", manager: "이민우 과장" },
    { id: "cnt_03", label: "분당구 치매안심센터", type: "Center", color: "#2563eb", address: "경기도 성남시 분당구 야탑로 8", tel: "031-729-3990", manager: "최진아 팀장" },
    
    // Services
    { id: "srv_01", label: "조기 무료검진", type: "Service", color: "#06b6d4", fee: "무료", target: "만 60세 이상 주민", desc: "선별검사(CIST)를 통한 치매 위험군 조기 판별" },
    { id: "srv_02", label: "인지재활 교실", type: "Service", color: "#06b6d4", fee: "무료", target: "경도 인지저하 및 초기 환자", desc: "기억력 향상 놀이 및 미술/원예 등 감각 치료" },
    { id: "srv_03", label: "가족 자조모임", type: "Service", color: "#06b6d4", fee: "무료", target: "치매 환자 보호자", desc: "치매케어 정보 공유 및 심리 상담 쉼터 제공" },
    { id: "srv_04", label: "치매 치료비 지원", type: "Service", color: "#06b6d4", fee: "정부 지원", target: "기준 중위소득 120% 이하", desc: "약제비 및 진료비 일부 월 3만원 정액 지원" },
    
    // Symptoms
    { id: "sym_01", label: "최근 기억 감퇴", type: "Symptom", color: "#ec4899" },
    { id: "sym_02", label: "약속/일정 반복 잊음", type: "Symptom", color: "#ec4899" },
    { id: "sym_03", label: "단어 사용의 어려움", type: "Symptom", color: "#ec4899" },
    { id: "sym_04", label: "성격 변화 및 감정 기복", type: "Symptom", color: "#ec4899" },
    { id: "sym_05", label: "시간/장소 인지 오류", type: "Symptom", color: "#ec4899" },
    { id: "sym_06", label: "대화 이해력 상실", type: "Symptom", color: "#ec4899" },
    { id: "sym_07", label: "배회 및 망상 증상", type: "Symptom", color: "#ec4899" },
    { id: "sym_08", label: "보행 장애 및 와상 상태", type: "Symptom", color: "#ec4899" },
    { id: "sym_09", label: "전적인 대소변 시중 필요", type: "Symptom", color: "#ec4899" },

    // Stages
    { id: "stg_01", label: "초기 (경도 치매)", type: "Stage", color: "#f59e0b", level: "CDR 1 (Mild)", info: "혼자 독립적인 일상생활이 일부 가능하나, 복잡한 사회 활동이나 재정 관리 등에는 실수가 잦은 상태" },
    { id: "stg_02", label: "중기 (중등도 치매)", type: "Stage", color: "#f59e0b", level: "CDR 2 (Moderate)", info: "기억장애가 깊어지고 일상생활(목욕, 옷 입기)에 부분적 도움이 필수적이며, 배회/반복 질문 등의 행동 장애 증가" },
    { id: "stg_03", label: "말기 (중증 치매)", type: "Stage", color: "#f59e0b", level: "CDR 3 (Severe)", info: "뇌 기능 상실로 신체 조절 능력이 저하되며, 보행이 불가능하거나 누워서 지내고 전적인 요양이 필요한 상태" },

    // CareMethods
    { id: "met_01", label: "회상 치료 (Reminiscence)", type: "CareMethod", color: "#10b981", typeDesc: "비약물적 치료", desc: "과거의 즐거운 추억(사진, 옛 음악)을 이야기하며 뇌의 연상 구역 활성화" },
    { id: "met_02", label: "현실 감각 훈련", type: "CareMethod", color: "#10b981", typeDesc: "비약물적 치료", desc: "매일 날짜, 계절, 시계를 확인시키며 시간 및 장소 지남력 유지 유도" },
    { id: "met_03", label: "음악 및 미술 요법", type: "CareMethod", color: "#10b981", typeDesc: "정서 안정", desc: "악기 연주, 노래 부르기, 드로잉 작업을 통해 감정 완화 및 공격성 진정" },
    { id: "met_04", label: "배회 감지기 착용", type: "CareMethod", color: "#10b981", typeDesc: "환자 안전", desc: "GPS 배회 감지기 기기를 지급하여 실종 사전 예방 및 빠른 구출 지원" },
    { id: "met_05", label: "체위 변경 (욕창 예방)", type: "CareMethod", color: "#10b981", typeDesc: "신체 케어", desc: "와상 상태 환자 대상, 2시간 주기로 매트리스 위 누운 방향 변경 및 마사지" },
    { id: "met_06", label: "스누젤렌(Snoezelen) 치료", type: "CareMethod", color: "#10b981", typeDesc: "감각 자극", desc: "빛, 향기, 부드러운 소리로 안락함을 제공하여 불안 및 수면 장애 조절" }
  ],
  
  edges: [
    // Region - Center
    { id: "e1", source: "reg_01", target: "cnt_01", label: "HAS_CENTER" },
    { id: "e2", source: "reg_02", target: "cnt_02", label: "HAS_CENTER" },
    { id: "e3", source: "reg_03", target: "cnt_03", label: "HAS_CENTER" },
    
    // Center - Service
    { id: "e4", source: "cnt_01", target: "srv_01", label: "PROVIDES" },
    { id: "e5", source: "cnt_01", target: "srv_02", label: "PROVIDES" },
    { id: "e6", source: "cnt_01", target: "srv_03", label: "PROVIDES" },
    { id: "e7", source: "cnt_01", target: "srv_04", label: "PROVIDES" },
    
    { id: "e8", source: "cnt_02", target: "srv_01", label: "PROVIDES" },
    { id: "e9", source: "cnt_02", target: "srv_02", label: "PROVIDES" },
    { id: "e10", source: "cnt_02", target: "srv_03", label: "PROVIDES" },
    
    { id: "e11", source: "cnt_03", target: "srv_01", label: "PROVIDES" },
    { id: "e12", source: "cnt_03", target: "srv_02", label: "PROVIDES" },
    { id: "e13", source: "cnt_03", target: "srv_04", label: "PROVIDES" },

    // Symptom - Stage
    { id: "e14", source: "sym_01", target: "stg_01", label: "INDICATES" },
    { id: "e15", source: "sym_02", target: "stg_01", label: "INDICATES" },
    { id: "e16", source: "sym_03", target: "stg_01", label: "INDICATES" },
    
    { id: "e17", source: "sym_04", target: "stg_02", label: "INDICATES" },
    { id: "e18", source: "sym_05", target: "stg_02", label: "INDICATES" },
    { id: "e19", source: "sym_06", target: "stg_02", label: "INDICATES" },
    
    { id: "e20", source: "sym_07", target: "stg_03", label: "INDICATES" },
    { id: "e21", source: "sym_08", target: "stg_03", label: "INDICATES" },
    { id: "e22", source: "sym_09", target: "stg_03", label: "INDICATES" },

    // Stage - CareMethod
    { id: "e23", source: "stg_01", target: "met_01", label: "RECOMMENDS" },
    { id: "e24", source: "stg_01", target: "met_02", label: "RECOMMENDS" },
    
    { id: "e25", source: "stg_02", target: "met_03", label: "RECOMMENDS" },
    { id: "e26", source: "stg_02", target: "met_04", label: "RECOMMENDS" },
    
    { id: "e27", source: "stg_03", target: "met_05", label: "RECOMMENDS" },
    { id: "e28", source: "stg_03", target: "met_06", label: "RECOMMENDS" }
  ]
};

// 3. PDF Preprocessing steps visualization mock data
export const pdfPreprocessMock = {
  filename: "중앙치매센터_치매가족교재_헤아림_제3장.pdf",
  totalPages: 14,
  samplePage: 12,
  steps: [
    {
      title: "1단계: 원본 PDF 레이아웃 분석",
      desc: "공공기관 및 병원 치매 가이드는 대다수 2단 다단 조판(Two-Column Layout)으로 출판되어, 일반 파서로 읽을 시 좌우 단의 텍스트 줄바꿈이 가로로 뒤엉켜 글자가 무작위로 합쳐지는 문제가 발생합니다.",
      type: "visual_pdf",
      data: {
        pageWidth: 595, // A4
        pageHeight: 842,
        header: { text: "제3장 치매 환자와 소통하는 방법 - 가족 교육 교재", rect: [40, 30, 515, 20] },
        columns: [
          {
            id: "col_1",
            rect: [40, 80, 240, 680],
            textBlocks: [
              { rect: [40, 80, 240, 40], text: "1. 환자에게 안정을 주는 대화 태도", isTitle: true },
              { rect: [40, 130, 240, 80], text: "치매가 진행되면 기억이나 단어 표현력은 떨어지지만, 정서적인 안정과 상대방의 목소리 톤, 표정 등 비언어적 단서는 매우 예민하게 느낍니다. 따라서 화를 내거나 비꼬는 대화 방식은 환자를 위축되게 만듭니다." },
              { rect: [40, 220, 240, 100], text: "특히 '방금 말씀드렸잖아요', '또 잊어버리셨어요?' 처럼 환자의 기억 저하를 지적하는 말은 당황스러움과 공격적인 불안 반응만을 자극하므로 삼가며, 차분하고 단호하되 신뢰를 주는 미소로 환자에게 반응하는 자세가 요구됩니다." }
            ]
          },
          {
            id: "col_2",
            rect: [315, 80, 240, 680],
            textBlocks: [
              { rect: [315, 80, 240, 40], text: "2. 구체적인 대화 기법 (10초의 법칙)", isTitle: true },
              { rect: [315, 130, 240, 100], text: "치매 환자가 대답을 고민하는 시간은 일반인보다 4~5배 이상 느릴 수 있습니다. 질문을 한 뒤, 조급하게 재촉하지 말고 마음속으로 열(10초)을 세며 편안한 눈빛으로 환자의 말을 기다려주십시오. 환자는 생각할 시간을 가짐으로써 정서적 차분함을 찾습니다." },
              { rect: [315, 240, 240, 80], text: "간단하고 구체적인 문장(한 번에 한 가지 주제)을 말하고, 추상적인 말보다는 '밥 드실래요?' 보다는 '김하고 밥 먹을까요?' 같은 명확한 행동 수식어를 사용하는 것이 바람직합니다." }
            ]
          }
        ],
        footer: { text: "중앙치매센터 | 45", rect: [40, 800, 515, 20] }
      }
    },
    {
      title: "2단계: 2단 다단 레이아웃 분리 및 순서 재배치",
      desc: "좌측 단(Column 1)의 블록들을 Y좌표 순으로 먼저 정렬하여 추출한 뒤, 우측 단(Column 2)의 블록을 병합하는 좌표 기반 바운딩 박스(Bounding Box) 결합 알고리즘을 적용하여 글의 읽기 흐름을 복원합니다.",
      type: "flow_reconstruction",
      data: {
        rawSequence: [
          { sender: "Standard Parser (Row-by-Row)", text: "1. 환자에게 안정을 주는 대화 태도 2. 구체적인 대화 기법 (10초의 법칙)", status: "error", comment: "가로 방향으로 두 개 칼럼 타이틀이 섞여 추출됨" },
          { sender: "Standard Parser (Row-by-Row)", text: "치매가 진행되면 기억이나 단어 표현력은 치매 환자가 대답을 고민하는 시간은", status: "error", comment: "본문 첫 문장들이 좌우가 혼재되어 문맥 파괴" }
        ],
        correctedSequence: [
          { order: 1, sourceCol: "Column 1 (좌)", text: "1. 환자에게 안정을 주는 대화 태도" },
          { order: 2, sourceCol: "Column 1 (좌)", text: "치매가 진행되면 기억이나 단어 표현력은 떨어지지만, 정서적인 안정과 상대방의 목소리 톤..." },
          { order: 3, sourceCol: "Column 1 (좌)", text: "특히 '방금 말씀드렸잖아요', '또 잊어버리셨어요?' 처럼 환자의 기억 저하를 지적하는 말은..." },
          { order: 4, sourceCol: "Column 2 (우)", text: "2. 구체적인 대화 기법 (10초의 법칙)" },
          { order: 5, sourceCol: "Column 2 (우)", text: "치매 환자가 대답을 고민하는 시간은 일반인보다 4~5배 이상 느릴 수 있습니다..." },
          { order: 6, sourceCol: "Column 2 (우)", text: "간단하고 구체적인 문장(한 번에 한 가지 주제)을 말하고, 추상적인 말보다는..." }
        ]
      }
    },
    {
      title: "3단계: 텍스트 노이즈 정제 & 마크다운 포맷팅",
      desc: "헤더 및 푸터 페이지 번호('제3장...', '중앙치매센터 | 45') 등 문서 정보 검색(RAG)의 노이즈가 되는 영역의 정적 텍스트를 제거하고, 정제된 텍스트 구조를 Markdown으로 포맷팅합니다.",
      type: "markdown_rendering",
      data: {
        removedElements: ["제3장 치매 환자와 소통하는 방법 - 가족 교육 교재", "중앙치매센터 | 45"],
        markdownResult: `## 1. 환자에게 안정을 주는 대화 태도

치매가 진행되면 기억이나 단어 표현력은 떨어지지만, 정서적인 안정과 상대방의 목소리 톤, 표정 등 비언어적 단서는 매우 예민하게 느낍니다. 따라서 화를 내거나 비꼬는 대화 방식은 환자를 위축되게 만듭니다.

특히 '방금 말씀드렸잖아요', '또 잊어버리셨어요?' 처럼 환자의 기억 저하를 지적하는 말은 당황스러움과 공격적인 불안 반응만을 자극하므로 삼가며, 차분하고 단호하되 신뢰를 주는 미소로 환자에게 반응하는 자세가 요구됩니다.

## 2. 구체적인 대화 기법 (10초의 법칙)

치매 환자가 대답을 고민하는 시간은 일반인보다 4~5배 이상 느릴 수 있습니다. 질문을 한 뒤, 조급하게 재촉하지 말고 마음속으로 열(10초)을 세며 편안한 눈빛으로 환자의 말을 기다려주십시오. 환자는 생각할 시간을 가짐으로써 정서적 차분함을 찾습니다.

간단하고 구체적인 문장(한 번에 한 가지 주제)을 말하고, 추상적인 말보다는 '밥 드실래요?' 보다는 '김하고 밥 먹을까요?' 같은 명확한 행동 수식어를 사용하는 것이 바람직합니다.`
      }
    },
    {
      title: "4단계: 의미 단위 청킹 및 메타데이터 주입",
      desc: "자연스러운 내용 연결성과 LLM 컨텍스트 한계를 고려해 문맥 분할(Semantic Chunking)을 실행하며, 10%의 중첩(Overlap) 비율을 설정하여 청킹 경계면의 맥락 유실을 차단하고 메타데이터(출처, 페이지, 토픽)를 연계합니다.",
      type: "chunk_display",
      data: {
        chunkSize: 200,
        overlap: 20,
        chunks: [
          {
            chunk_id: "chunk_h3_p12_01",
            source: "중앙치매센터_치매가족교재_헤아림.pdf",
            page: 12,
            title: "환자 안정을 주는 대화와 감정 공감",
            content: "치매가 진행되면 기억이나 단어 표현력은 떨어지지만, 정서적인 안정과 상대방의 목소리 톤, 표정 등 비언어적 단서는 매우 예민하게 느낍니다. 화를 내거나 지적하는 방식은 환자의 불안과 공격성을 키우므로, 신뢰감을 주는 미소로 환자의 감정에 공감하며 대화하는 태도가 필수적입니다.",
            overlapText: "화를 내거나 지적하는 방식은 환자의 불안과 공격성을 키우므로"
          },
          {
            chunk_id: "chunk_h3_p12_02",
            source: "중앙치매센터_치매가족교재_헤아림.pdf",
            page: 12,
            title: "치매 환자의 소통 대기시간 및 구체적 질문 요령",
            content: "[중첩 영역: 화를 내거나 지적하는 방식은 환자의 불안과 공격성을 키우므로...] 질문을 던지고 마음속으로 최소 10초를 기다리는 '10초의 법칙'을 실천합니다. 짧고 간단한 문장 구조로 한번에 하나씩 묻고, 모호한 질문 대신 구체적인 사물이나 동작 단어를 선택하여 소통의 오류를 줄여야 합니다.",
            overlapText: "[중첩 영역: 화를 내거나 지적하는 방식은 환자의 불안과 공격성을 키우므로...]"
          }
        ]
      }
    }
  ]
};
