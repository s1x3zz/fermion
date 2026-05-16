import './styles/themes.css';
import './index.css';
import './styles/fonts.css';
import { render } from 'solid-js/web';
import { App } from './App';
const root = document.getElementById('root');
if (!root)
    throw new Error('#root element not found');
render(() => <App />, root);
//# sourceMappingURL=main.jsx.map