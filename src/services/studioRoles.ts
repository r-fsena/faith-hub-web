/** Same canonical aliases used by backend authorization; this changes presentation only. */
export function normalizeStudioRole(value?:string){
 const role=String(value||'MEMBER').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
 const aliases:Record<string,string>={'LIDER DE CELULA':'LEADER',LIDER:'LEADER',MEMBRO:'MEMBER',VISITANTE:'MEMBER',ADMINISTRADOR:'ADMIN',TESOUREIRO:'TREASURER',VOLUNTARIO:'VOLUNTEER',SUPER_ADMIN:'SUPERADMIN',MASTER_ADMIN:'SUPERADMIN',MASTER:'SUPERADMIN',ADMIN_MASTER:'SUPERADMIN'};
 return aliases[role]||role;
}
