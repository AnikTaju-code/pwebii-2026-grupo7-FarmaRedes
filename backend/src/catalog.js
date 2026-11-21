export const medicamentos = [
  {
    id: 'med1',
    nome: 'Paracetamol',
    dosagem: '500 mg',
    categoria: 'Dor e febre',
    icone: '💊',
    descricao: 'Analgésico e antipirético',
  },
  {
    id: 'med2',
    nome: 'Ibuprofeno',
    dosagem: '400 mg',
    categoria: 'Dor e inflamação',
    icone: '💊',
    descricao: 'Anti-inflamatório',
  },
  {
    id: 'med3',
    nome: 'Vitamina C',
    dosagem: '1000 mg',
    categoria: 'Vitaminas',
    icone: '💊',
    descricao: 'Suplemento vitamínico',
  },
  {
    id: 'med4',
    nome: 'Soro fisiológico',
    dosagem: '0,9% · 500 ml',
    categoria: 'Cuidados',
    icone: '💊',
    descricao: 'Solução salina',
  },
  {
    id: 'med5',
    nome: 'Loratadina',
    dosagem: '10 mg',
    categoria: 'Alergias',
    icone: '💊',
    descricao: 'Anti-histamínico',
  },
  {
    id: 'med6',
    nome: 'Omeprazol',
    dosagem: '20 mg',
    categoria: 'Digestivo',
    icone: '💊',
    descricao: 'Redutor da acidez gástrica',
  },
  {
    id: 'med7',
    nome: 'Álcool 70%',
    dosagem: '250 ml',
    categoria: 'Cuidados',
    icone: '💊',
    descricao: 'Antisséptico',
  },
  {
    id: 'med8',
    nome: 'Termómetro digital',
    dosagem: '1 unidade',
    categoria: 'Equipamentos',
    icone: '💊',
    descricao: 'Medição de temperatura',
  },
];
export const haversine = (a, b, c, d) => {
  const rad = x => (x * Math.PI) / 180;
  const p1 = rad(a),
    p2 = rad(c),
    dp = rad(c - a),
    dl = rad(d - b);
  return (
    Math.round(
      6371 *
        2 *
        Math.asin(
          Math.sqrt(Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2),
        ) *
        10,
    ) / 10
  );
};
