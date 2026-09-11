/**
 * Créditos de las fotografías y el vídeo de Wikimedia Commons.
 *
 * Las licencias Creative Commons BY y BY-SA permiten usarlas en un sitio
 * comercial SIEMPRE QUE se cite autor, licencia y origen. Esta lista
 * alimenta la página /credits (enlazada desde el pie) y los créditos que
 * muestra el visor de reels.
 *
 * Al añadir una imagen nueva de Commons, añadirla aquí.
 */

export type Credit = {
  /** Ruta dentro de /public. */
  file: string
  title: string
  author: string
  license: 'CC BY 2.0' | 'CC BY 4.0' | 'CC BY-SA 3.0' | 'CC BY-SA 4.0'
  /** Página del archivo en Commons. */
  source: string
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const LICENSE_URLS: Record<Credit['license'], string> = {
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

export const credits = {
  santaAna: {
    file: '/img/reels/santa-ana.jpg',
    title: 'Laguna cratérica del Volcán de Santa Ana',
    author: 'Erneestoo',
    license: 'CC BY-SA 4.0',
    source: `${COMMONS}Laguna_crat%C3%A9rica_del_Volc%C3%A1n_de_Santa_Ana_-_El_Salvador.jpg`,
  },
  elTunco: {
    file: '/img/reels/el-tunco.jpg',
    title: 'Tunco1',
    author: 'Rafael Colindres',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Tunco1.jpg`,
  },
  juayua: {
    file: '/img/reels/ruta-de-las-flores.jpg',
    title: 'Iglesia de Juayúa',
    author: 'JosueArguera',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Iglesia_de_Juay%C3%BAa.JPG`,
  },
  coatepeque: {
    file: '/img/reels/coatepeque.jpg',
    title: 'Coatepeque Vista',
    author: 'JMRAFFi',
    license: 'CC BY 4.0',
    source: `${COMMONS}Coatepeque_Vista.jpg`,
  },
  suchitoto: {
    file: '/img/reels/suchitoto.jpg',
    title: 'Calles de Suchitoto',
    author: 'ElmerGuevara',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Calles_de_Suchitoto.jpg`,
  },
  sunset: {
    file: '/img/reels/surf.jpg',
    title: 'Salvador-Sunset',
    author: 'Saperaud (Wikimedia Commons)',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Salvador-Sunset.jpg`,
  },
  sanMiguel: {
    file: '/reels/san-miguel.webm',
    title: 'Volcán San Miguel Chaparrastique en El Salvador',
    author: 'Alloyblue',
    license: 'CC BY-SA 4.0',
    source: `${COMMONS}Volcan_San_Miguel_Chaparrastique_en_El_Salvador.webm`,
  },
  santaLucia: {
    file: '/img/categoria-cultura.jpg',
    title: 'Belleza histórica Iglesia Santa Lucía de Suchitoto',
    author: 'Koky2013',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Belleza_hist%C3%B3rica_Iglesia_Santa_Luc%C3%ADa_de_Suchitoto.JPG`,
  },
  palacioNacional: {
    file: '/img/experiences/centro-historico.jpg',
    title: 'Palacio Nacional de El Salvador (San Salvador)',
    author: 'Mario Pleitez',
    license: 'CC BY 2.0',
    source: `${COMMONS}Palacio_Nacional_de_El_Salvador_(San_Salvador).jpg`,
  },
  montecristo: {
    file: '/img/experiences/bosque-montecristo.jpg',
    title: 'Bosque interior Parque Nacional Montecristo 01',
    author: 'ElmerGuevara',
    license: 'CC BY-SA 3.0',
    source: `${COMMONS}Bosque_interior_Parque_Nacional_Montecristo_01.JPG`,
  },
} satisfies Record<string, Credit>

export const allCredits: Credit[] = Object.values(credits)
