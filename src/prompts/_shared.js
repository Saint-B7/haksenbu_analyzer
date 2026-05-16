// 프롬프트 공통 헤더
// 3개 phase(core/extended/multi) 모두에서 사용되는 컨텍스트 도입부.
// 진로·학과 입력 조합 4가지를 처리하고 가독성 강조 규칙을 명시한다.

export const buildContextHeader = (activityType, grade, careerGoal, desiredMajor) => {
  const cp = !!careerGoal?.trim(), mp = !!desiredMajor?.trim();
  let inputRule;
  if (cp && mp)        inputRule = `진로·학과 모두 입력. 둘을 함께 고려.`;
  else if (cp && !mp)  inputRule = `진로 "${careerGoal}"만 입력. 학과는 진로에서 도출되는 1~2개를 추론하여 사용.`;
  else if (!cp && mp)  inputRule = `학과 "${desiredMajor}"만 입력. 진로는 학과에서 도출되는 1~2개를 추론하여 사용.`;
  else                 inputRule = `둘 다 미입력. 본문에서 도출되는 학과·진로 방향을 추정.`;
  return `[현재 분석 대상]
- 학년: ${grade}  /  항목: ${activityType}활동
- 진로 희망: ${careerGoal || '(미입력)'}  /  희망 학과: ${desiredMajor || '(미입력)'}
- 입력 처리: ${inputRule}

[가독성 강조 규칙]
모든 분석 텍스트(rationale, evidence, comment, scoreReason 등)에서 핵심 키워드·수치·개념·이론명·자료명은 **이중 별표**로 감쌀 것. 예: "**다중회귀**와 **표본 350명**이 명시되어 **대학 2학년 수준**".

JSON 외 코드펜스(\`\`\`)·해설·머리말 일체 금지. 모든 큰따옴표는 \\" 로 이스케이프.`;
};
