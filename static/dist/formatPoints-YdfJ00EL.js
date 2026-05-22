const n=r=>{if(r==null||r==="")return"—";const e=Number(r);return Number.isNaN(e)?"—":Number.isInteger(e)?String(e):e.toFixed(2).replace(/\.?0+$/,"")};export{n as f};
