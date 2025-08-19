# 📰 News App (Expo + React Native)

यह एक demo **News App** है जिसे `expo-router` का इस्तेमाल करके बनाया गया है।  
इसमें user login कर सकता है या फिर **Guest Mode** में बिना login के app use कर सकता है।  
Login के बाद user को उसका नाम या email के साथ personalized greeting दिखेगा।  

---

## ✨ Features
- 🔐 **Login & Guest Login** option  
- 👋 Personalized greeting (`Good Morning, {User}`)  
- 📰 **News Feed** with horizontal scroll cards  
- 🧭 **Custom Tab Navigation** (rounded modern UI with icons)  
- ⚡ Built with **Expo Router** for smooth navigation  

---

## 📂 Project Structure
project-root/
│── app/
│ ├── (tabs)/
│ │ ├── home.tsx
│ │ ├── about.tsx
│ │ ├── profile.tsx
│ │ ├── news.tsx
│ │ └── _layout.tsx
│ ├── login.tsx
│ └── _layout.tsx
│── assets/
│── package.json
│── README.md 
## 🚀 Installation & Setup

1. Clone repo:
```bash
git clone https://github.com/SANKETSD18/react_native.git
cd REACT_NATIVE

2.Dependencies install करो:

npm install

3.Expo start करो:

npx expo start


🔑 Login Flow

अगर user email + password डालता है → उसे News Page पर ले जाया जाएगा।

अगर user Continue without Login दबाता है → सीधे Guest Mode News Feed खुल जाएगा।


🛠 Tech Stack

React Native

Expo

Expo Router