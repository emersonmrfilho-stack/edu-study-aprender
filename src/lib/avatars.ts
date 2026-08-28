import eduClassico from "@/assets/edu-mascot.png";
import eduAstronauta from "@/assets/edu-astronauta.png";
import eduCientista from "@/assets/edu-cientista.png";
import eduFormado from "@/assets/edu-formado.png";
import eduHeroi from "@/assets/edu-heroi.png";
import eduAtleta from "@/assets/edu-atleta.png";
import eduRei from "@/assets/edu-rei.png";

export type EduAvatar = {
  id: string;
  name: string;
  description: string;
  src: string;
  price: number; // em gemas (0 = grátis)
};

/** Fotos de perfil do Edu disponíveis na loja de gemas. */
export const AVATARS: EduAvatar[] = [
  {
    id: "classico",
    name: "Edu Clássico",
    description: "O Edu de sempre, pronto para estudar.",
    src: eduClassico,
    price: 0,
  },
  {
    id: "formado",
    name: "Edu Formado",
    description: "Beca, capelo e diploma na mão.",
    src: eduFormado,
    price: 300,
  },
  {
    id: "cientista",
    name: "Edu Cientista",
    description: "Jaleco, óculos de proteção e experimentos.",
    src: eduCientista,
    price: 500,
  },
  {
    id: "atleta",
    name: "Edu Atleta",
    description: "Uniforme verde e amarelo para as batalhas.",
    src: eduAtleta,
    price: 700,
  },
  {
    id: "astronauta",
    name: "Edu Astronauta",
    description: "Traje espacial para estudar até na Lua.",
    src: eduAstronauta,
    price: 900,
  },
  {
    id: "heroi",
    name: "Edu Herói",
    description: "Máscara e capa para salvar suas notas.",
    src: eduHeroi,
    price: 1200,
  },
  {
    id: "rei",
    name: "Edu Rei",
    description: "Coroa dourada para quem domina o ranking.",
    src: eduRei,
    price: 1800,
  },
];

export const DEFAULT_AVATAR_ID = "classico";

export function getAvatar(id?: string | null): EduAvatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}

export function avatarSrc(id?: string | null): string {
  return getAvatar(id).src;
}
