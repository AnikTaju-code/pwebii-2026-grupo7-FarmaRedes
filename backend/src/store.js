import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve(process.env.DATA_DIR || path.join(process.cwd(), 'data'));
const filename = path.join(dir, 'estado.json');
export function inicial() {
  return { farmacias: [], stock: [], pedidos: [], utilizadores: [] };
}
export function carregar() {
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filename)) {
    const state = inicial();
    salvar(state);
    return state;
  }
  const db = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return { ...inicial(), ...db };
}
export function salvar(state) {
  fs.mkdirSync(dir, { recursive: true });
  const temp = filename + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(state, null, 2));
  fs.renameSync(temp, filename);
}
