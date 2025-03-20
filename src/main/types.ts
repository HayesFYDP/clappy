type ProductivityAnalysis = {
  productive: boolean;
  confidence: number;
  justification: string;
};

enum ClappyExpression {
  Happy = 'HAPPY',
  Crying = 'CRYING',
  Disappointed = 'DISAPPOINTED',
  Enraged = 'ENRAGED',
  Hello = 'HELLO',
  Chomp = 'CHOMP',
  Thwack = 'THWACK',
  OffersMicrophone = 'OFFERS_MICROPHONE',
  Despair = 'DESPAIR',
  Suspicious = 'SUSPICIOUS',
}

// eslint-disable-next-line import/prefer-default-export
export { ProductivityAnalysis, ClappyExpression };
