import {createRoot} from 'react-dom/client';
import { IS_GOLD_EDITION } from './config/edition';
import App from './App.tsx';
import './index.css';
import './theme-royal.css';
import './theme-parchment.css';

if (IS_GOLD_EDITION) {
  document.documentElement.dataset.linGoEdition = 'gold';
}

createRoot(document.getElementById('root')!).render(<App />);
