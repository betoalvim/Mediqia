// database.js - Dados simulados para o aplicativo Mediqia

const PHARMACIES = [
  {
    id: "verde",
    name: "Farmácia Verde",
    logo: "🌿",
    deliveryFee: 4.90,
    deliveryTime: "30-50 min",
    rating: 4.8
  },
  {
    id: "drogasil",
    name: "Drogasil",
    logo: "💊",
    deliveryFee: 5.90,
    deliveryTime: "20-40 min",
    rating: 4.9
  },
  {
    id: "paguemenos",
    name: "Pague Menos",
    logo: "🏷️",
    deliveryFee: 3.50,
    deliveryTime: "40-60 min",
    rating: 4.6
  },
  {
    id: "saopaulo",
    name: "Drogaria São Paulo",
    logo: "🏪",
    deliveryFee: 6.00,
    deliveryTime: "15-35 min",
    rating: 4.7
  }
];

const MEDICINES_CATALOG = [
  {
    id: "dipirona",
    name: "Dipirona Monoidratada 500mg",
    brand: "Medley Genéricos",
    requiresPrescription: false,
    prices: {
      verde: 4.50,
      drogasil: 3.90,
      paguemenos: 4.20,
      saopaulo: 4.10
    },
    generic: {
      name: "Dipirona Sódica 500mg (Genérico)",
      brand: "EMS Genéricos",
      prices: {
        verde: 3.90,
        drogasil: 3.20,
        paguemenos: 3.50,
        saopaulo: 3.40
      }
    }
  },
  {
    id: "amoxicilina",
    name: "Amoxicilina 500mg (30 cápsulas)",
    brand: "EMS Genéricos",
    requiresPrescription: true,
    prices: {
      verde: 32.00,
      drogasil: 34.90,
      paguemenos: 29.90,
      saopaulo: 35.50
    },
    generic: {
      name: "Amoxicilina 500mg Genérico (30 cáps.)",
      brand: "Pharlab",
      prices: {
        verde: 21.50,
        drogasil: 23.90,
        paguemenos: 19.80,
        saopaulo: 22.00
      }
    }
  },
  {
    id: "losartana",
    name: "Losartana Potássica 50mg (30 comp.)",
    brand: "Neo Química",
    requiresPrescription: false,
    prices: {
      verde: 12.00,
      drogasil: 9.90,
      paguemenos: 10.50,
      saopaulo: 11.00
    },
    generic: {
      name: "Losartana 50mg Genérico (30 comp.)",
      brand: "Sandoz",
      prices: {
        verde: 8.50,
        drogasil: 7.00,
        paguemenos: 7.50,
        saopaulo: 7.80
      }
    },
    discountAgreement: {
      minQuantity: 2,
      discountPercentage: 15,
      description: "Convênio Laboratório: 15% off na compra de 2+ un."
    }
  },
  {
    id: "omeprazol",
    name: "Omeprazol 20mg (30 cápsulas)",
    brand: "Medley",
    requiresPrescription: false,
    prices: {
      verde: 8.00,
      drogasil: 9.50,
      paguemenos: 8.90,
      saopaulo: 9.20
    },
    generic: {
      name: "Omeprazol 20mg Genérico (30 cáps.)",
      brand: "Germed",
      prices: {
        verde: 6.00,
        drogasil: 7.20,
        paguemenos: 6.50,
        saopaulo: 6.80
      }
    },
    discountAgreement: {
      minQuantity: 2,
      discountPercentage: 20,
      description: "Convênio Laboratório: 20% off na compra de 2+ un."
    }
  },
  {
    id: "ibuprofeno",
    name: "Ibuprofeno 600mg (20 comp.)",
    brand: "Alivium",
    requiresPrescription: false,
    prices: {
      verde: 25.00,
      drogasil: 10.00,
      paguemenos: 18.00,
      saopaulo: 15.00
    },
    generic: {
      name: "Ibuprofeno 600mg Genérico (20 comp.)",
      brand: "Medley",
      prices: {
        verde: 18.00,
        drogasil: 8.00,
        paguemenos: 12.00,
        saopaulo: 11.00
      }
    }
  },
  {
    id: "simeticona",
    name: "Simeticona 75mg/mL Gotas (15mL)",
    brand: "Luftal",
    requiresPrescription: false,
    prices: {
      verde: 10.00,
      drogasil: 28.00,
      paguemenos: 20.00,
      saopaulo: 19.90
    },
    generic: {
      name: "Simeticona 75mg/mL Gotas Genérico (15mL)",
      brand: "Neo Química",
      prices: {
        verde: 7.00,
        drogasil: 18.00,
        paguemenos: 13.00,
        saopaulo: 12.00
      }
    }
  },
  {
    id: "dorsanol",
    name: "Dorsanol Paracetamol 750mg (20 comp.)",
    brand: "Sanofi",
    requiresPrescription: false,
    prices: {
      verde: 11.20,
      drogasil: 12.90,
      paguemenos: 10.50,
      saopaulo: 11.90
    },
    generic: {
      name: "Paracetamol 750mg Genérico (20 comp.)",
      brand: "Biosintética",
      prices: {
        verde: 6.80,
        drogasil: 7.90,
        paguemenos: 6.20,
        saopaulo: 7.20
      }
    }
  },
  {
    id: "prednisona",
    name: "Prednisona 20mg (10 comp.)",
    brand: "Mylan",
    requiresPrescription: false,
    prices: {
      verde: 16.00,
      drogasil: 15.00,
      paguemenos: 15.50,
      saopaulo: 15.80
    },
    generic: {
      name: "Prednisona 20mg Genérico (10 comp.)",
      brand: "EMS",
      prices: {
        verde: 12.00,
        drogasil: 11.00,
        paguemenos: 11.50,
        saopaulo: 11.80
      }
    },
    progressivePromo: {
      prices: {
        2: 25.00,
        3: 34.00
      }
    }
  },
  {
    id: "clonazepam",
    name: "Clonazepam 2mg (30 comp)",
    brand: "Rivotril (Referência)",
    requiresPrescription: true,
    isTarjaPreta: true,
    prices: {
      verde: 18.50,
      drogasil: 17.20,
      paguemenos: 17.90,
      saopaulo: 18.10
    },
    generic: {
      name: "Clonazepam 2mg Genérico (30 comp)",
      brand: "EMS Genéricos",
      prices: {
        verde: 10.50,
        drogasil: 9.20,
        paguemenos: 9.90,
        saopaulo: 10.00
      }
    }
  },
  {
    id: "atorvastatina",
    name: "Lipitor Atorvastatina 20mg (30 comp)",
    brand: "Pfizer",
    requiresPrescription: false,
    prices: {
      verde: 45.90,
      drogasil: 43.50,
      paguemenos: 44.00,
      saopaulo: 44.80
    },
    generic: {
      name: "Atorvastatina Cálcica 20mg (30 comp)",
      brand: "EMS Genéricos",
      prices: {
        verde: 28.50,
        drogasil: 26.00,
        paguemenos: 27.20,
        saopaulo: 27.50
      }
    }
  },
  {
    id: "metformina",
    name: "Glifage Metformina 850mg (30 comp)",
    brand: "Merck",
    requiresPrescription: false,
    prices: {
      verde: 15.00,
      drogasil: 13.90,
      paguemenos: 14.50,
      saopaulo: 14.20
    },
    generic: {
      name: "Metformina 850mg Genérico (30 comp)",
      brand: "Prati-Donaduzzi",
      prices: {
        verde: 8.50,
        drogasil: 7.90,
        paguemenos: 8.10,
        saopaulo: 8.20
      }
    },
    discountAgreement: {
      minQuantity: 2,
      discountPercentage: 10,
      description: "Convênio Laboratório: 10% off na compra de 2+ un."
    }
  },
  {
    id: "alprazolam",
    name: "Frontal Alprazolam 1mg (30 comp)",
    brand: "Pfizer",
    requiresPrescription: true,
    isTarjaPreta: true,
    prices: {
      verde: 39.90,
      drogasil: 37.50,
      paguemenos: 38.00,
      saopaulo: 38.50
    },
    generic: {
      name: "Alprazolam 1mg Genérico (30 comp)",
      brand: "Medley Genéricos",
      prices: {
        verde: 22.00,
        drogasil: 19.80,
        paguemenos: 20.50,
        saopaulo: 21.00
      }
    }
  },
  {
    id: "diazepam",
    name: "Valium Diazepam 10mg (30 comp)",
    brand: "Roche",
    requiresPrescription: true,
    isTarjaPreta: true,
    prices: {
      verde: 18.20,
      drogasil: 17.50,
      paguemenos: 17.80,
      saopaulo: 18.00
    },
    generic: {
      name: "Diazepam 10mg Genérico (30 comp)",
      brand: "Neo Química",
      prices: {
        verde: 9.80,
        drogasil: 8.90,
        paguemenos: 9.20,
        saopaulo: 9.50
      }
    }
  },
  {
    id: "sertralina",
    name: "Zoloft Sertralina 50mg (30 comp)",
    brand: "Pfizer",
    requiresPrescription: true,
    prices: {
      verde: 65.00,
      drogasil: 62.90,
      paguemenos: 63.50,
      saopaulo: 64.00
    },
    generic: {
      name: "Sertralina 50mg Genérico (30 comp)",
      brand: "Teuto Genéricos",
      prices: {
        verde: 35.00,
        drogasil: 32.50,
        paguemenos: 33.80,
        saopaulo: 34.00
      }
    }
  },
  {
    id: "fluoxetina",
    name: "Daforin Fluoxetina 20mg (30 comp)",
    brand: "Sigma Pharma",
    requiresPrescription: true,
    prices: {
      verde: 42.00,
      drogasil: 39.90,
      paguemenos: 40.50,
      saopaulo: 41.00
    },
    generic: {
      name: "Fluoxetina 20mg Genérico (30 comp)",
      brand: "EMS Genéricos",
      prices: {
        verde: 21.00,
        drogasil: 18.90,
        paguemenos: 19.50,
        saopaulo: 20.00
      }
    }
  },
  {
    id: "loratadina",
    name: "Claritin Loratadina 10mg (12 comp)",
    brand: "Bayer",
    requiresPrescription: false,
    prices: {
      verde: 26.50,
      drogasil: 24.90,
      paguemenos: 25.20,
      saopaulo: 25.80
    },
    generic: {
      name: "Loratadina 10mg Genérico (12 comp)",
      brand: "Medley Genéricos",
      prices: {
        verde: 14.50,
        drogasil: 12.90,
        paguemenos: 13.50,
        saopaulo: 13.80
      }
    }
  },
  {
    id: "pantoprazol",
    name: "Pantozol Pantoprazol 40mg (28 comp)",
    brand: "Takeda",
    requiresPrescription: false,
    prices: {
      verde: 68.00,
      drogasil: 65.00,
      paguemenos: 66.50,
      saopaulo: 67.20
    },
    generic: {
      name: "Pantoprazol 40mg Genérico (28 comp)",
      brand: "Eurofarma",
      prices: {
        verde: 36.00,
        drogasil: 33.50,
        paguemenos: 34.90,
        saopaulo: 35.00
      }
    }
  },
  {
    id: "enalapril",
    name: "Renitec Enalapril 20mg (30 comp)",
    brand: "MSD",
    requiresPrescription: false,
    prices: {
      verde: 24.00,
      drogasil: 22.50,
      paguemenos: 23.00,
      saopaulo: 23.80
    },
    generic: {
      name: "Maleato de Enalapril 20mg Genérico (30 comp)",
      brand: "Sandoz",
      prices: {
        verde: 12.80,
        drogasil: 11.50,
        paguemenos: 12.00,
        saopaulo: 12.20
      }
    }
  },
  {
    id: "losartana_anlodipino",
    name: "Angipress Losartana+Anlodipino 50+5mg",
    brand: "Biosintética",
    requiresPrescription: false,
    prices: {
      verde: 48.00,
      drogasil: 45.00,
      paguemenos: 46.50,
      saopaulo: 47.00
    },
    generic: {
      name: "Losartana + Anlodipino Genérico (30 comp)",
      brand: "EMS Genéricos",
      prices: {
        verde: 28.00,
        drogasil: 25.50,
        paguemenos: 26.90,
        saopaulo: 27.20
      }
    },
    progressivePromo: {
      prices: {
        2: 78.00,
        3: 110.00
      }
    }
  },
  {
    id: "sildenafila",
    name: "Viagra Sildenafila 50mg (4 comp)",
    brand: "Pfizer",
    requiresPrescription: false,
    prices: {
      verde: 35.00,
      drogasil: 32.90,
      paguemenos: 33.50,
      saopaulo: 34.00
    },
    generic: {
      name: "Citrato de Sildenafila 50mg Genérico (4 comp)",
      brand: "Neo Química",
      prices: {
        verde: 15.00,
        drogasil: 12.90,
        paguemenos: 13.50,
        saopaulo: 14.00
      }
    }
  }
];

const SHOP_PRODUCTS = [
  {
    id: "omega3",
    name: "Ômega 3 Ultra 1000mg",
    description: "Óleo de peixe de alta pureza rico em EPA e DHA. Auxilia na saúde cardiovascular e cognitiva. Contém 120 cápsulas gelatinosas de fácil deglutição.",
    price: 79.90,
    originalPrice: 99.90,
    discount: "20%",
    rating: 4.9,
    reviews: 142,
    pharmacyId: "drogasil",
    category: "Suplementos",
    image: "vendor/img/ph-4b3142bf-300.jpg",
    progressivePromo: {
      prices: {
        2: 139.80,
        3: 199.70
      }
    }
  },
  {
    id: "vitc",
    name: "Vitamina C Redoxon Triple Acción",
    description: "Vitamina C, D e Zinco para reforço do sistema imunológico. Tubo com 10 comprimidos efervescentes sabor laranja. Dissolução rápida.",
    price: 18.90,
    originalPrice: 24.90,
    discount: "24%",
    rating: 4.8,
    reviews: 89,
    pharmacyId: "paguemenos",
    category: "Vitaminas",
    image: "vendor/img/placeholder-produto.svg"
  },
  {
    id: "protetorsolar",
    name: "Protetor Solar La Roche-Posay Anthelios SPF 60",
    description: "Toque limpo com controle de oleosidade e muito alta proteção UVB/UVA. Textura gel-creme ideal para peles mistas a oleosas. Sem perfume, resistente à água.",
    price: 69.90,
    originalPrice: 89.90,
    discount: "22%",
    rating: 4.7,
    reviews: 210,
    pharmacyId: "drogasil",
    category: "Dermocosméticos",
    image: "vendor/img/ph-fc9aa908-300.jpg"
  },
  {
    id: "colageno",
    name: "Colágeno Hidrolisado Verisol com Ácido Hialurônico",
    description: "Suplemento alimentar em pó sabor frutas vermelhas. Auxilia na manutenção da saúde e elasticidade da pele, unhas e cabelos. Zero açúcares e glúten. Pote com 250g.",
    price: 89.90,
    originalPrice: 119.90,
    discount: "25%",
    rating: 4.6,
    reviews: 73,
    pharmacyId: "verde",
    category: "Suplementos",
    image: "vendor/img/ph-7bb81c04-300.jpg"
  },
  {
    id: "hidratantecera",
    name: "Creme Hidratante CeraVe 454g",
    description: "Hidratação profunda para peles secas a extrassecas. Fórmula com 3 ceramidas essenciais e ácido hialurônico. Tecnologia MVE para liberação prolongada de hidratação.",
    price: 110.00,
    originalPrice: 129.90,
    discount: "15%",
    rating: 4.9,
    reviews: 412,
    pharmacyId: "saopaulo",
    category: "Dermocosméticos",
    image: "vendor/img/ph-7bbbfe19-300.jpg"
  },
  {
    id: "wheyprotein",
    name: "Whey Protein Concentrado 100% Pure 900g",
    description: "Proteína concentrada do soro do leite sabor baunilha. Auxilia na formação de músculos e ossos. Alta concentração de BCAA. Ideal para pós-treino.",
    price: 99.00,
    originalPrice: 120.00,
    discount: "17%",
    rating: 4.8,
    reviews: 304,
    pharmacyId: "verde",
    category: "Suplementos",
    image: "vendor/img/ph-7ccdbaba-300.jpg"
  }
];

// Presets de receitas reconhecidas pelo OCR simulado
const PRESCRIPTION_PRESETS = {
  preset1: {
    title: "Receita Cardiológica e Geral",
    medicines: ["dipirona", "losartana", "omeprazol", "atorvastatina", "metformina"],
    doctorName: "Dr. João Silva",
    doctorSpecialty: "Cardiologista",
    scanImage: "vendor/img/ph-e5d09982-400.jpg"
  },
  preset2: {
    title: "Receita Neurológica Controlada",
    medicines: ["clonazepam", "alprazolam", "diazepam", "sertralina", "ibuprofeno"],
    doctorName: "Dra. Patrícia Helena Reis",
    doctorSpecialty: "Neurologista",
    scanImage: "vendor/img/ph-51b55104-400.jpg"
  },
  preset3: {
    title: "Receita Mista de Sintomas",
    medicines: ["pantoprazol", "loratadina", "simeticona", "prednisona", "dorsanol"],
    doctorName: "Dr. Carlos Lima",
    doctorSpecialty: "Clínico Geral",
    scanImage: "vendor/img/ph-dba999ef-400.jpg"
  },
  preset4: {
    title: "Receita Premium Completa",
    medicines: ["dipirona", "losartana", "prednisona", "clonazepam", "omeprazol"],
    doctorName: "Dra. Patrícia Helena Reis",
    doctorSpecialty: "Neurologista & Cardiologista",
    scanImage: "vendor/img/ph-dba999ef-400.jpg"
  }
};
