type ProductivityAnalysis = {
  productive: boolean;
  confidence: number;
  justification: string;
};

enum ClappyExpression {
  Happy = 'happy',
  Sad = 'sad',
  Angry = 'angry',
}

// eslint-disable-next-line import/prefer-default-export
export { ProductivityAnalysis, ClappyExpression };
