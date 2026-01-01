import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Traducciones
const resources = {
  en: {
    translation: {
      "hero.subtitle": "Contemporary Curation",
      "nav.orders": "Track Orders",
      "cart.back": "Back to Boutique",
      "product.availableColors": "Available Colors",
      "product.selectSize": "Select Size",
      "product.addToBag": "Add to Bag",
      "categories.Todos": "All",
      "categories.Camisas": "Shirts",
      "categories.Poloches": "Polos",
      "categories.Pantalones": "Pants",
      "categories.Calzado": "Footwear",
      "categories.Gorras": "Caps",
      "categories.Carteras": "Wallets",
      "categories.Correas": "Belts",
      "categories.Accesorios": "Accessories",
      "categories.Ofertas": "Deals"
    }
  },
  es: {
    translation: {
      "hero.subtitle": "Curaduría Contemporánea",
      "nav.orders": "Mis Pedidos",
      "cart.back": "Volver a la Tienda",
      "product.availableColors": "Colores Disponibles",
      "product.selectSize": "Seleccionar Talla",
      "product.addToBag": "Agregar al Carrito",
      "categories.Todos": "Todos",
      "categories.Camisas": "Camisas",
      "categories.Poloches": "Polos",
      "categories.Pantalones": "Pantalones",
      "categories.Calzado": "Calzado",
      "categories.Gorras": "Gorras",
      "categories.Carteras": "Carteras",
      "categories.Correas": "Correas",
      "categories.Accesorios": "Accesorios",
      "categories.Ofertas": "Ofertas"
    }
  },
  fr: {
    translation: {
      "hero.subtitle": "Curation Contemporaine",
      "nav.orders": "Mes Commandes",
      "cart.back": "Retour à la Boutique",
      "product.availableColors": "Couleurs Disponibles",
      "product.selectSize": "Choisir la Taille",
      "product.addToBag": "Ajouter au Panier",
      "categories.Todos": "Tous",
      "categories.Camisas": "Chemises",
      "categories.Poloches": "Polos",
      "categories.Pantalones": "Pantalons",
      "categories.Calzado": "Chaussures",
      "categories.Gorras": "Casquettes",
      "categories.Carteras": "Portefeuilles",
      "categories.Correas": "Ceintures",
      "categories.Accesorios": "Accessoires",
      "categories.Ofertas": "Offres"
    }
  },
  hi: {
    translation: {
      "hero.subtitle": "समकालीन क्यूरेशन",
      "nav.orders": "ऑर्डर ट्रैक करें",
      "cart.back": "बुटीक पर वापस जाएं",
      "product.availableColors": "उपलब्ध रंग",
      "product.selectSize": "आकार चुनें",
      "product.addToBag": "बैग में जोड़ें",
      "categories.Todos": "सभी",
      "categories.Camisas": "शर्ट्स",
      "categories.Poloches": "पोलो",
      "categories.Pantalones": "पैंट",
      "categories.Calzado": "जूते",
      "categories.Gorras": "टोपियां",
      "categories.Carteras": "बटुए",
      "categories.Correas": "बेल्ट",
      "categories.Accesorios": "सामान",
      "categories.Ofertas": "सौदा"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;