import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		proxy: {
			'/connect': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				ws: true,
				secure: false,
				ssl: false,
			}
		}
	}
});
