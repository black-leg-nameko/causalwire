export function stripControls(value:string):string{return [...value].filter((char)=>{const code=char.charCodeAt(0);return code>31&&!(code>=127&&code<=159);}).join('');}
export function escapeHtml(value:unknown):string{return stripControls(String(value??'')).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
export function middleEllipsis(value:string,max=52):string{return value.length<=max?value:`${value.slice(0,Math.floor(max/2)-1)}…${value.slice(-(Math.ceil(max/2)-1))}`;}
