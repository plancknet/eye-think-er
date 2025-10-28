export const wordLists = {
  countries: [
    'Brasil', 'Portugal', 'Espanha', 'França', 'Itália', 'Alemanha',
    'Inglaterra', 'Japão', 'China', 'Índia', 'México', 'Argentina',
    'Canadá', 'Austrália', 'Rússia', 'Egito', 'Marrocos', 'Grécia',
    'Turquia', 'Tailândia', 'Vietnã', 'Coreia', 'Chile', 'Peru',
    'Colômbia', 'Suécia', 'Noruega', 'Dinamarca', 'Finlândia', 'Islândia',
    'Irlanda', 'Holanda', 'Bélgica', 'Suíça', 'Áustria'
  ],
  fruits: [
    'Maçã', 'Banana', 'Laranja', 'Morango', 'Uva', 'Melancia',
    'Abacaxi', 'Manga', 'Mamão', 'Pêra', 'Kiwi', 'Cereja',
    'Ameixa', 'Pêssego', 'Limão', 'Melão', 'Framboesa', 'Amora',
    'Coco', 'Goiaba', 'Maracujá', 'Acerola', 'Jabuticaba', 'Caqui',
    'Romã', 'Figo', 'Lichia', 'Carambola', 'Pitaya', 'Graviola',
    'Açaí', 'Cupuaçu', 'Tâmara', 'Nectarina', 'Tangerina'
  ],
  animals: [
    'Leão', 'Tigre', 'Elefante', 'Girafa', 'Zebra', 'Macaco',
    'Cachorro', 'Gato', 'Cavalo', 'Vaca', 'Porco', 'Ovelha',
    'Coelho', 'Lobo', 'Urso', 'Panda', 'Canguru', 'Koala',
    'Pinguim', 'Golfinho', 'Baleia', 'Tubarão', 'Polvo', 'Tartaruga',
    'Cobra', 'Crocodilo', 'Águia', 'Coruja', 'Papagaio', 'Pato',
    'Borboleta', 'Abelha', 'Formiga', 'Aranha', 'Escorpião'
  ]
};

export function getRandomWords(theme: keyof typeof wordLists, count: number): string[] {
  const words = [...wordLists[theme]];
  const selected: string[] = [];
  
  for (let i = 0; i < count && words.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    selected.push(words[randomIndex]);
    words.splice(randomIndex, 1);
  }
  
  return selected;
}
