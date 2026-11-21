export function reconcileCart(cart, stock, farmaciaId) {
  let changed = false;
  const items = [];

  for (const item of cart) {
    const available =
      stock.find(row => row.farmaciaId === farmaciaId && row.medicamentoId === item.medicamentoId)
        ?.quantidade ?? 0;
    const quantidade = Math.min(item.quantidade, available);

    if (quantidade !== item.quantidade) changed = true;
    if (quantidade > 0) items.push({ ...item, quantidade });
  }

  return { items, changed };
}
