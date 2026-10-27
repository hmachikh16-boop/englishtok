import { createRoot } from 'react-dom/client';
import { GoldPreview } from './components/gold/GoldPreview.tsx';
import './index.css';
import './theme-royal.css';
import './gold-preview.css';

createRoot(document.getElementById('root')!).render(<GoldPreview />);
