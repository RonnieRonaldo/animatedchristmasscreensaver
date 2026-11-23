const te=new TextEncoder();const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',...headers}});
const originOK=r=>r.headers.get('Origin')===new URL(r.url).origin;
const cookies=r=>Object.fromEntries((r.headers.get('Cookie')||'').split(';').map(s=>s.trim().split('=')));
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const unb64=s=>Uint8Array.from(atob(s.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function key(secret){return crypto.subtle.importKey('raw',te.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify'])}
async function sign(value,secret){const body=b64(te.encode(JSON.stringify(value)));return body+'.'+b64(new Uint8Array(await crypto.subtle.sign('HMAC',await key(secret),te.encode(body))))}
async function verify(value,secret){try{if(!secret||!value||value.length>4096)return null;const [body,sig]=value.split('.');if(!await crypto.subtle.verify('HMAC',await key(secret),unb64(sig),te.encode(body)))return null;const d=JSON.parse(new TextDecoder().decode(unb64(body)));return d.exp>Date.now()?d:null}catch{return null}}
const cookie=(name,value,seconds)=>`${name}=${value}; Path=/; Max-Age=${seconds}; HttpOnly; Secure; SameSite=Lax`;
function configured(e){return e.CHECKOUT_ENABLED==='true'&&!!e.PADDLE_API_KEY&&/^pri_[a-z0-9]+$/.test(e.PADDLE_PRICE_ID||'')&&!!e.PADDLE_CLIENT_TOKEN&&(e.ACCESS_SECRET||'').length>=32&&!!e.PRODUCT}
async function paddle(e,path,method='GET',body){const base=e.PADDLE_ENV==='sandbox'?'https://sandbox-api.paddle.com':'https://api.paddle.com';const r=await fetch(base+path,{method,headers:{Authorization:'Bearer '+e.PADDLE_API_KEY,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Payment service unavailable');return (await r.json()).data}
export default {async fetch(request,env){const url=new URL(request.url),path=url.pathname;try{
 if(path==='/api/config')return json({checkoutReady:configured(env),clientToken:configured(env)?env.PADDLE_CLIENT_TOKEN:'',environment:env.PADDLE_ENV==='sandbox'?'sandbox':'production',displayPrice:env.DISPLAY_PRICE||'',analyticsId:env.GA_MEASUREMENT_ID||''});
 if(path==='/api/checkout'){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!originOK(request))return json({error:'Invalid origin'},403);if(!configured(env))return json({error:'Checkout is not open yet.'},503);
  const existing=await verify(cookies(request).christmas_checkout,env.ACCESS_SECRET);const nonce=existing?.nonce||b64(crypto.getRandomValues(new Uint8Array(32)));
  const transaction=await paddle(env,'/transactions','POST',{items:[{price_id:env.PADDLE_PRICE_ID,quantity:1}],collection_mode:'automatic',custom_data:{purchase_nonce:nonce},checkout:{url:url.origin+'/animated-christmas-screensaver'}});
  return json({transactionId:transaction.id},200,{'Set-Cookie':cookie('christmas_checkout',await sign({nonce,exp:Date.now()+86400000},env.ACCESS_SECRET),86400)});
 }
 if(path==='/api/claim'){
  if(request.method!=='POST')return json({error:'Method not allowed'},405);if(!originOK(request))return json({error:'Invalid origin'},403);if(!configured(env))return json({error:'Not configured'},503);
  const checkout=await verify(cookies(request).christmas_checkout,env.ACCESS_SECRET);if(!checkout)return json({error:'Purchase browser not recognised'},403);
  if(Number(request.headers.get('Content-Length')||0)>4096)return json({error:'Invalid request'},400);let data;try{data=await request.json()}catch{return json({error:'Invalid request'},400)}
  if(!/^txn_[a-z0-9]{26}$/.test(data.transactionId||''))return json({error:'Invalid transaction'},400);
  const tx=await paddle(env,'/transactions/'+data.transactionId);
  if(tx.custom_data?.purchase_nonce!==checkout.nonce||!tx.items?.some(item=>item.price?.id===env.PADDLE_PRICE_ID))return json({error:'Purchase does not match'},403);
  if(tx.status!=='completed')return json({error:'Payment is still processing'},409);
  const session=await sign({transaction:tx.id,exp:Date.now()+365*86400000},env.ACCESS_SECRET);return json({access:true},200,{'Set-Cookie':cookie('christmas_access',session,365*86400)});
 }
 if(path==='/api/access')return json({access:!!await verify(cookies(request).christmas_access,env.ACCESS_SECRET)});
 if(path==='/experience'||path.startsWith('/experience/')){
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
  if(!await verify(cookies(request).christmas_access,env.ACCESS_SECRET))return Response.redirect(url.origin+'/access.html',303);
  if(!env.PRODUCT)return new Response('Your experience is temporarily unavailable. Please contact Ronald.',{status:503});
  if(path==='/experience')return Response.redirect(url.origin+'/experience/',308);
  let objectKey;try{objectKey=decodeURIComponent(path.slice('/experience/'.length))}catch{return new Response('Invalid path',{status:400})}
  if(objectKey.split('/').some(part=>part==='..'||part.startsWith('.'))||objectKey.includes('\\'))return new Response('Not found',{status:404});
  if(!objectKey||objectKey.endsWith('/'))objectKey+='index.html';
  const object=await env.PRODUCT.get(objectKey);if(!object)return new Response('Not found',{status:404});
  const headers=new Headers({'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'});object.writeHttpMetadata(headers);headers.set('Cache-Control','private, no-store');const ext=objectKey.split('.').pop();const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css',png:'image/png',webp:'image/webp',wav:'audio/wav',mp3:'audio/mpeg',ttf:'font/ttf',svg:'image/svg+xml',json:'application/json'};if(types[ext])headers.set('Content-Type',types[ext]);return new Response(request.method==='HEAD'?null:object.body,{headers});
 }
 if(path.startsWith('/api/'))return json({error:'Not found'},404);
 return env.ASSETS.fetch(request);
 }catch{return path.startsWith('/api/')?json({error:'Temporarily unavailable. Please try again.'},502):new Response('Temporarily unavailable',{status:503})}}};
