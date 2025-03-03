type ProductivityAnalysis = {
  productive: boolean;
  confidence: number;
  justification: string;
};

enum ClappyExpression {
  Happy = 'happy',
  Crying = 'crying',
  Disappointed = 'disappointed',
  Enraged = 'enraged',
  Hello = 'hello',
}

// eslint-disable-next-line import/prefer-default-export
export { ProductivityAnalysis, ClappyExpression };
