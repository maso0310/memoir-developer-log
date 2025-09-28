let MEMOIR_DATA=null;
let _0x5678=0;
let _0x68ac=0;
let _0x7ae0=0;
let _0x8d14=false;
let _0x9f48=true;
const globalImageCache=new Map();
const eventMediaCache=new Map();
function cacheImage(src,blobUrl){
globalImageCache.set(src,{
blobUrl:blobUrl,
timestamp:Date.now()
});
}
function cacheEventMedia(eventIndex,mediaIndex,blobUrl){
if(!eventMediaCache.has(eventIndex)){
eventMediaCache.set(eventIndex,new Map());
}
eventMediaCache.get(eventIndex).set(mediaIndex,blobUrl);
console.log(`📦 事件 ${eventIndex}媒體 ${mediaIndex}已快取`);
}
function getEventMediaCache(eventIndex,mediaIndex){
const eventCache=eventMediaCache.get(eventIndex);
return eventCache ? eventCache.get(mediaIndex):null;
}
function clearEventCache(eventIndex){
if(eventMediaCache.has(eventIndex)){
eventMediaCache.delete(eventIndex);
console.log(`🗑️ 清除事件 ${eventIndex}的快取`);
}
}
function getCachedImage(src){
const cached=globalImageCache.get(src);
if(cached){
cached.timestamp=Date.now();
return cached.blobUrl;
}
return null;
}
function isImageCached(src){
return globalImageCache.has(src);
}
let _0xb17c=parseInt(localStorage.getItem('memoirflow:typing-speed'))||100;
let _0xc3b0=2;
let _0xd5e4=false;
let _0xe818=true;
let _0xfa4c=false;
let _0x10c80=false;
let _0x11eb4=false;
let _0x130e8=false;
let _0x1431c=false;
let _0x15550=true;
let _0x16784=!true;
let _0x179b8=!false;
let isTitleHidden=!true;
let _0x18bec=false;
let _0x19e20='sunset';
let _0x1b054=_0x19e20&&_0x19e20!=='undefined'&&_0x19e20!==''
? _0x19e20
:(localStorage.getItem('memoir-theme')||'default');
window.debugTheme=function(){
};
window.clearThumbnailCache=function(){
const oldSize=thumbnailCache.size;
const oldDecryptedSize=thumbnailDecryptedState.size;
thumbnailCache.clear();
thumbnailDecryptedState.clear();
console.log(`🗑️ 清理縮圖快取:${oldSize}個HTML快取+${oldDecryptedSize}個解密狀態快取`);
renderThumbnails();
};
window.showThumbnailCacheStatus=function(){
console.log('📊 縮圖快取狀態報告:');
console.log(`-HTML快取:${thumbnailCache.size}個事件`);
console.log(`-解密狀態快取:${thumbnailDecryptedState.size}個事件`);
thumbnailCache.forEach((content,key)=>{
const decryptedCount=thumbnailDecryptedState.get(key)?.size||0;
console.log(` 📁 ${key}:${content.length}字符,${decryptedCount}個已解密縮圖`);
});
};
let actualFontSize=parseFloat(localStorage.getItem('memoir-font-size'))||_0xc3b0;
let actualTypingSpeed=parseInt(localStorage.getItem('memoirflow:typing-speed'))||_0xb17c;
let actualThumbnailsVisible=localStorage.getItem('memoir-thumbnails-visible')!==null
? localStorage.getItem('memoir-thumbnails-visible')==='true'
:_0xe818;
const elements={
loadingScreen:document.getElementById('loadingScreen'),
app:document.getElementById('app'),
mediaDisplay:document.getElementById('mediaDisplay'),
eventDescription:document.getElementById('eventDescription'),
timeline:document.getElementById('timeline'),
currentEventDate:document.getElementById('currentEventDate'),
currentMemoirTitle:document.getElementById('currentMemoirTitle'),
thumbnails:document.getElementById('thumbnails'),
prevEventBtn:document.getElementById('prevEventBtn'),
nextEventBtn:document.getElementById('nextEventBtn'),
prevMediaBtn:document.getElementById('prevMediaBtn'),
nextMediaBtn:document.getElementById('nextMediaBtn'),
timelineBtn:document.getElementById('timelineBtn'),
timelinePanel:document.getElementById('timelinePanel'),
closeTimelineBtn:document.getElementById('closeTimelineBtn'),
descriptionContainer:document.getElementById('descriptionContainer'),
subtitleToggleBtn:document.getElementById('subtitleToggleBtn'),
menuBtn:document.getElementById('menuBtn'),
menuBtnIcon:document.getElementById('menuBtnIcon'),
menuDropdown:document.getElementById('menuDropdown'),
typewriterToggleBtn:document.getElementById('typewriterToggleBtn'),
typewriterSpeedBtn:document.getElementById('typewriterSpeedBtn'),
typewriterSpeedDropdown:document.getElementById('typewriterSpeedDropdown'),
thumbnailBtn:document.getElementById('thumbnailBtn'),
fontSizeBtn:document.getElementById('fontSizeBtn'),
fontSizeDropdown:document.getElementById('fontSizeDropdown'),
thumbnailsContainer:document.getElementById('thumbnailsContainer'),
thumbnailToggleArrow:document.getElementById('thumbnailToggleArrow'),
hideControlsBtn:document.getElementById('hideControlsBtn'),
hideDateBtn:document.getElementById('hideDateBtn'),
hideTitleBtn:document.getElementById('hideTitleBtn'),
themeBtn:document.getElementById('themeBtn'),
themeDropdown:document.getElementById('themeDropdown'),
themeOverlay:document.getElementById('themeOverlay'),
lightbox:document.getElementById('lightbox'),
lightboxClose:document.getElementById('lightboxClose'),
lightboxPrev:document.getElementById('lightboxPrev'),
lightboxNext:document.getElementById('lightboxNext'),
lightboxMedia:document.getElementById('lightboxMedia')
};
function debounce(func,wait){
let timeout;
return function executedFunction(...args){
const later=()=>{
clearTimeout(timeout);
func.apply(this,args);
};
clearTimeout(timeout);
timeout=setTimeout(later,wait);
};
}
let currentEventId=null;
let thumbnailCache=new Map();
let thumbnailDecryptedState=new Map();
let isTimelineCollapsed=false;
let touchStartX=0;
let touchStartY=0;
function typewriterEffect(element,text,speed=_0xb17c,eventId=null){
if(!element||!text)return Promise.resolve();
return new Promise(resolve=>{
element.textContent='';
element.classList.add('typewriter','typewriter-cursor');
let index=0;
let isCompleted=false;
const timer=setInterval(()=>{
if(eventId!==null&&currentEventId!==eventId){
clearInterval(timer);
element.classList.remove('typewriter-cursor');
if(!isCompleted){
isCompleted=true;
resolve();
}
return;
}
if(index<text.length){
element.textContent+=text.charAt(index);
index++;
}else{
clearInterval(timer);
element.classList.remove('typewriter-cursor');
if(!isCompleted){
isCompleted=true;
resolve();
}
}
},speed);
const skipTyping=()=>{
if(!isCompleted){
clearInterval(timer);
element.textContent=text;
element.classList.remove('typewriter-cursor');
element.removeEventListener('click',skipTyping);
isCompleted=true;
resolve();
}
};
element.addEventListener('click',skipTyping,{once:true});
});
}
function fadeTransition(element,newContent,callback){
if(!element)return Promise.resolve();
return new Promise(resolve=>{
element.classList.add('fade-out');
setTimeout(()=>{
if(typeof newContent==='function'){
newContent();
}else if(typeof newContent==='string'){
element.innerHTML=newContent;
}
element.classList.remove('fade-out');
element.classList.add('fade-in');
setTimeout(()=>{
element.classList.remove('fade-in');
if(callback)callback();
resolve();
},800);
},500);
});
}
function slideTransition(element,direction='right',callback,fastMode=false){
if(!element)return Promise.resolve();
return new Promise(resolve=>{
const slideClass=direction==='right' ? 'slide-in-right':'slide-in-left';
const handleAnimationEnd=(event)=>{
if(event.target===element){
element.removeEventListener('animationend',handleAnimationEnd);
element.classList.remove(slideClass);
resolve();
}
};
element.addEventListener('animationend',handleAnimationEnd);
requestAnimationFrame(()=>{
if(callback)callback();
requestAnimationFrame(()=>{
element.classList.add(slideClass);
});
});
const fallbackTime=fastMode ? 200:650;
setTimeout(()=>{
if(element.classList.contains(slideClass)){
element.removeEventListener('animationend',handleAnimationEnd);
element.classList.remove(slideClass);
resolve();
}
},fallbackTime);
});
}
let buttonDebounceTimeouts=new Map();
function debounceButtonClick(buttonId,callback,delay=300){
if(buttonDebounceTimeouts.has(buttonId)){
clearTimeout(buttonDebounceTimeouts.get(buttonId));
}
const timeout=setTimeout(()=>{
callback();
buttonDebounceTimeouts.delete(buttonId);
},delay);
buttonDebounceTimeouts.set(buttonId,timeout);
}
function addTouchFeedback(element){
if(!element)return;
element.classList.add('touch-feedback');
element.addEventListener('touchstart',(e)=>{
element.classList.add('touching');
setTimeout(()=>{
element.classList.remove('touching');
},800);
});
element.addEventListener('mousedown',(e)=>{
element.classList.add('touching');
setTimeout(()=>{
element.classList.remove('touching');
},800);
});
}
function renderTimeline(){
if(!MEMOIR_DATA?.timeline_events||!elements.timeline)return;
const timelineLine=elements.timeline.querySelector('.timeline-line');
elements.timeline.innerHTML='';
if(timelineLine){
elements.timeline.appendChild(timelineLine);
}else{
const line=document.createElement('div');
line.className='timeline-line';
elements.timeline.appendChild(line);
}
const fragment=document.createDocumentFragment();
MEMOIR_DATA.timeline_events.forEach((event,index)=>{
const item=document.createElement('div');
item.className=`timeline-item ${index===_0x5678 ? 'active':''}`;
const title=event.title||event.name||`事件 ${index+1}`;
const date=event.date||'';
item.innerHTML=`
<div style="font-size:0.9rem;font-weight:600;color:var(--text-primary);margin-bottom:0.25rem;">
${title}
</div>
${date ? `<div style="font-size:0.75rem;color:var(--primary);margin-bottom:0.25rem;">${date}</div>`:''}
<div style="font-size:0.7rem;color:var(--text-secondary);line-height:1.2;">
${event.description ? event.description.substring(0,50)+'...':''}
</div>
`;
item.addEventListener('click',()=>{
if(index!==_0x5678){
jumpToEvent(index);
closeTimelinePanel();
}
});
addTouchFeedback(item);
fragment.appendChild(item);
});
elements.timeline.appendChild(fragment);
}
function jumpToEvent(eventIndex){
if(eventIndex===_0x5678)return;
const direction=eventIndex>_0x5678 ? 'right':'left';
_0x5678=eventIndex;
_0x68ac=0;
const timelineItems=elements.timeline.querySelectorAll('.timeline-item');
timelineItems.forEach((item,index)=>{
item.classList.toggle('active',index===_0x5678);
});
renderThumbnails();
slideTransition(elements.descriptionContainer,direction,()=>{
loadEvent();
});
}
function toggleTimelinePanel(){
if(elements.timelinePanel){
elements.timelinePanel.classList.toggle('open');
}
}
function closeTimelinePanel(){
if(elements.timelinePanel){
elements.timelinePanel.classList.remove('open');
}
}
function setupTouchGestures(){
let touchStartX=0;
let touchStartY=0;
let touchStartTime=0;
let isSwiping=false;
document.addEventListener('touchstart',(e)=>{
touchStartX=e.touches[0].clientX;
touchStartY=e.touches[0].clientY;
touchStartTime=Date.now();
isSwiping=false;
},{passive:false});
document.addEventListener('touchmove',(e)=>{
if(!e.target.closest('.menu-dropdown')&&
!e.target.closest('.timeline-panel')&&
!e.target.closest('input[type="range"]')){
e.preventDefault();
}
const touchX=e.touches[0].clientX;
const touchY=e.touches[0].clientY;
const deltaX=Math.abs(touchX-touchStartX);
const deltaY=Math.abs(touchY-touchStartY);
if(deltaX>10||deltaY>10){
isSwiping=true;
}
},{passive:false});
document.addEventListener('touchend',(e)=>{
if(!isSwiping)return;
const touchEndX=e.changedTouches[0].clientX;
const touchEndY=e.changedTouches[0].clientY;
const touchEndTime=Date.now();
const deltaX=touchEndX-touchStartX;
const deltaY=touchEndY-touchStartY;
const deltaTime=touchEndTime-touchStartTime;
if(deltaTime>800)return;
const minSwipeDistance=50;
const absX=Math.abs(deltaX);
const absY=Math.abs(deltaY);
if(!e.target.closest('.menu-dropdown')&&
!e.target.closest('.timeline-panel')){
if(absX>minSwipeDistance&&absX>absY){
e.preventDefault();
if(deltaX>0){
if(elements.prevMediaBtn&&!elements.prevMediaBtn.disabled){
elements.prevMediaBtn.click();
}
}else{
if(elements.nextMediaBtn&&!elements.nextMediaBtn.disabled){
elements.nextMediaBtn.click();
}
}
}
else if(absY>minSwipeDistance&&absY>absX){
e.preventDefault();
if(deltaY>0){
if(elements.prevEventBtn&&!elements.prevEventBtn.disabled){
elements.prevEventBtn.click();
}
}else{
if(elements.nextEventBtn&&!elements.nextEventBtn.disabled){
elements.nextEventBtn.click();
}
}
}
}
isSwiping=false;
},{passive:false});
}
function cleanupInvalidDataOriginalSrc(){
const allImages=document.querySelectorAll('img[data-original-src]');
let cleanedCount=0;
allImages.forEach(img=>{
const originalSrc=img.getAttribute('data-original-src');
if(!originalSrc||originalSrc.includes('null')||originalSrc==='null'){
console.log('🧹 清理無效的 data-original-src:',originalSrc);
img.removeAttribute('data-original-src');
img.removeAttribute('data-needs-mse-decrypt');
cleanedCount++;
}
});
if(cleanedCount>0){
console.log(`✅ 已清理 ${cleanedCount}個無效的 data-original-src 屬性`);
}
}
function quickDecryptMedia(){
if(!window.forceDecryptMedia||_0x8d14)return;
cleanupInvalidDataOriginalSrc();
const needsDecryptImages=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.mse-decrypted):not(.fast-loaded)');
if(needsDecryptImages.length===0){
console.log('🎯 沒有需要解密的圖片，跳過解密調用');
return;
}
_0x8d14=true;
console.log(`🔓 開始解密 ${needsDecryptImages.length}張圖片`);
try{
window.forceDecryptMedia();
}finally{
_0x8d14=false;
}
}
function getCurrentEvent(){
if(!MEMOIR_DATA){
console.warn('⚠️ MEMOIR_DATA 尚未載入');
return null;
}
if(!MEMOIR_DATA.timeline_events){
console.warn('⚠️ MEMOIR_DATA.timeline_events 不存在');
return null;
}
if(_0x5678>=MEMOIR_DATA.timeline_events.length){
console.warn('⚠️ _0x5678 超出範圍');
return null;
}
return MEMOIR_DATA.timeline_events[_0x5678];
}
function displayMedia(fastSwitch=false){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media||currentEvent.media.length===0){
if(elements.mediaDisplay){
elements.mediaDisplay.innerHTML='<div>此事件沒有媒體檔案</div>';
}
return;
}
const media=currentEvent.media[_0x68ac];
if(!media||!elements.mediaDisplay)return;
elements.mediaDisplay.innerHTML='';
let mediaElement;
if(media.type==='image'||media.media_type==='image'){
mediaElement=document.createElement('img');
mediaElement.alt='回憶錄圖片';
const mediaSrc=media.src||media.url||(media.filename ? `./media/${media.filename}`:null);
if(!mediaSrc||mediaSrc.includes('null')){
console.warn('⚠️ 跳過無效媒體路徑:',media);
elements.mediaDisplay.innerHTML='<div>媒體檔案路徑無效</div>';
return;
}
if(mediaSrc.includes('media/')){
let fastLoadSuccess=false;
const eventCachedUrl=getEventMediaCache(_0x5678,_0x68ac);
if(eventCachedUrl){
console.log(`🚀 使用事件快取:事件${_0x5678}媒體${_0x68ac}`);
mediaElement.src=eventCachedUrl;
mediaElement.classList.add('fast-loaded');
fastLoadSuccess=true;
}
else{
const cachedBlobUrl=getCachedImage(mediaSrc);
if(cachedBlobUrl){
console.log(`⚡ 使用全域快取圖片:${_0x68ac+1}`);
mediaElement.src=cachedBlobUrl;
mediaElement.classList.add('fast-loaded');
fastLoadSuccess=true;
}
}
if(!fastLoadSuccess){
const existingDecryptedImgs=document.querySelectorAll('img.mse-decrypted');
for(let img of existingDecryptedImgs){
const imgOriginalSrc=img.getAttribute('data-original-src')||img.getAttribute('src');
if(imgOriginalSrc===mediaSrc&&img.src.startsWith('blob:')){
console.log(`⚡ 使用已解密圖片:${_0x68ac+1}`);
mediaElement.src=img.src;
mediaElement.classList.add('fast-loaded');
cacheImage(mediaSrc,img.src);
fastLoadSuccess=true;
break;
}
}
}
if(!fastLoadSuccess&&elements.thumbnails){
const thumbnails=elements.thumbnails.querySelectorAll('.thumbnail');
const currentEvent=getCurrentEvent();
if(thumbnails.length===currentEvent?.media?.length&&_0x68ac<thumbnails.length){
const targetThumbnail=thumbnails[_0x68ac];
const thumbnailImg=targetThumbnail?.querySelector('img');
if(thumbnailImg&&thumbnailImg.classList.contains('mse-decrypted')){
const expectedMediaSrc=currentEvent.media[_0x68ac]?.src;
if(expectedMediaSrc&&thumbnailImg.getAttribute('data-original-src')===expectedMediaSrc){
console.log(`📸 使用縮圖快取圖片:${_0x68ac+1}(縮圖列${_0xe818 ? '可見':'隱藏'})`);
mediaElement.src=thumbnailImg.src;
mediaElement.classList.add('fast-loaded');
cacheImage(mediaSrc,thumbnailImg.src);
cacheEventMedia(_0x5678,_0x68ac,thumbnailImg.src);
fastLoadSuccess=true;
}
}
}
}
if(!fastLoadSuccess){
mediaElement.setAttribute('data-needs-mse-decrypt','true');
if(mediaSrc&&!mediaSrc.includes('null')&&mediaSrc!=='null'){
mediaElement.setAttribute('data-original-src',mediaSrc);
}else{
console.error('🚫 阻止設置無效的 data-original-src:',mediaSrc);
return;
}
mediaElement.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
setTimeout(()=>{
if(mediaElement&&mediaElement.parentNode&&!mediaElement.classList.contains('fast-loaded')){
quickDecryptMedia();
}
},fastSwitch ? 0:10);
}
}else{
mediaElement.src=mediaSrc;
}
}else if(media.type==='video'||media.media_type==='video'){
mediaElement=document.createElement('video');
mediaElement.controls=true;
mediaElement.src=media.src||media.url||(media.filename ? `./media/${media.filename}`:'');
}
if(mediaElement){
mediaElement.style.cursor='pointer';
mediaElement.addEventListener('click',()=>{
openLightbox(mediaElement);
});
if(mediaElement.classList.contains('fast-loaded')){
mediaElement.setAttribute('data-mse-fixed','true');
mediaElement.setAttribute('data-fast-loaded','true');
}
elements.mediaDisplay.appendChild(mediaElement);
}
}
function adjustThumbnailContainerWidth(){
if(!elements.thumbnails||!_0xe818)return;
const thumbnails=elements.thumbnails.querySelectorAll('.thumbnail');
if(thumbnails.length===0)return;
const thumbnailWidth=60;
const gap=8;
const padding=32;
const neededWidth=thumbnails.length*thumbnailWidth+(thumbnails.length-1)*gap+padding;
const screenWidth=window.innerWidth;
const menuSpacing=160;
const maxAllowedWidth=screenWidth-menuSpacing;
const finalWidth=Math.min(neededWidth,maxAllowedWidth);
elements.thumbnails.style.width=finalWidth+'px';
console.debug('adjustThumbnailContainerWidth:thumbnails=',thumbnails.length,'needed=',neededWidth,'max=',maxAllowedWidth,'final=',finalWidth);
}
function updateThumbnailSelection(){
if(!elements.thumbnails)return;
const thumbnails=elements.thumbnails.querySelectorAll('.thumbnail');
let activeThumbnail=null;
thumbnails.forEach((thumbnail,index)=>{
const isActive=index===_0x68ac;
thumbnail.classList.toggle('active',isActive);
if(isActive){
activeThumbnail=thumbnail;
}
});
adjustThumbnailContainerWidth();
if(activeThumbnail&&elements.thumbnails&&_0xe818&&!_0x1431c){
try{
const container=elements.thumbnails;
const containerRect=container.getBoundingClientRect();
const thumbnailRect=activeThumbnail.getBoundingClientRect();
if(container.scrollWidth<=container.clientWidth){
return;
}
const containerCenter=container.clientWidth/2;
const thumbnailRelativePosition=activeThumbnail.offsetLeft+(activeThumbnail.offsetWidth/2);
const targetScrollLeft=thumbnailRelativePosition-containerCenter;
const maxScrollLeft=container.scrollWidth-container.clientWidth;
const finalScrollLeft=Math.max(0,Math.min(targetScrollLeft,maxScrollLeft));
console.debug('updateThumbnailSelection:centering thumbnail',_0x68ac,'scrollTo:',finalScrollLeft);
container.scrollTo({
left:finalScrollLeft,
behavior:'smooth'
});
}catch(error){
console.debug('updateThumbnailSelection:scroll error:',error);
}
}
}
function bindThumbnailClickEvents(){
if(!elements.thumbnails)return;
const thumbnails=elements.thumbnails.querySelectorAll('.thumbnail');
thumbnails.forEach((thumbnail,index)=>{
thumbnail.addEventListener('click',()=>{
const previousIndex=_0x68ac;
const newIndex=index;
if(previousIndex===newIndex)return;
const direction=newIndex>previousIndex ? 'right':'left';
_0x68ac=newIndex;
_0x7ae0=_0x68ac;
slideTransition(elements.mediaDisplay,direction,()=>{
displayMedia(true);
updateThumbnailSelection();
updateNavigationButtons();
if(elements.lightbox?.classList.contains('active')){
slideTransition(elements.lightboxMedia,direction,()=>{
displayLightboxMedia();
updateLightboxNavigation();
},true);
}
},true);
});
});
}
function renderThumbnails(force=false){
if(!force&&renderThumbnails._isRendering){
return;
}
if(!force&&renderThumbnails._lastRenderTime&&Date.now()-renderThumbnails._lastRenderTime<100){
clearTimeout(renderThumbnails._debounceTimer);
renderThumbnails._debounceTimer=setTimeout(()=>renderThumbnails(true),50);
return;
}
renderThumbnails._isRendering=true;
renderThumbnails._lastRenderTime=Date.now();
const allThumbnailElements=document.querySelectorAll('#thumbnails');
if(allThumbnailElements.length>1){
}
const currentEvent=getCurrentEvent();
for(let[key,value]of thumbnailCache.entries()){
if(typeof value!=='string'){
thumbnailCache.delete(key);
}
}
if(!_0xe818){
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.remove('visible');
}
console.log('🔧 縮圖列隱藏中，但繼續渲染以維持快取');
}
if(!elements.thumbnails){
renderThumbnails._isRendering=false;
return;
}
const mediaSignature=currentEvent?.media?.map(m=>
`${m.filename||'unknown'}-${m.type||m.media_type||'unknown'}`
).join('|')||'empty';
const eventDatePart=currentEvent?.date ? `-date-${currentEvent.date.replace(/[-:]/g,'')}`:'';
const eventDescPart=currentEvent?.description ? `-desc-${currentEvent.description.substring(0,10).replace(/\s/g,'')}`:'';
const cacheKey=`event-${_0x5678}-media-${currentEvent?.media?.length||0}${eventDatePart}${eventDescPart}-sig-${mediaSignature.substring(0,30)}`;
if(thumbnailCache.has(cacheKey)){
console.log('🚀 使用縮圖快取，跳過重新渲染:',cacheKey);
const cachedContent=thumbnailCache.get(cacheKey);
elements.thumbnails.innerHTML='';
elements.thumbnails.innerHTML=cachedContent;
if(thumbnailDecryptedState.has(cacheKey)){
const decryptedStates=thumbnailDecryptedState.get(cacheKey);
const thumbnails=elements.thumbnails.querySelectorAll('.thumbnail');
decryptedStates.forEach((stateInfo,index)=>{
if(thumbnails[index]){
const img=thumbnails[index].querySelector('img');
if(img&&stateInfo&&stateInfo.blobUrl&&stateInfo.originalSrc){
const expectedSrc=img.getAttribute('data-original-src')||img.getAttribute('src');
if(expectedSrc===stateInfo.originalSrc){
img.src=stateInfo.blobUrl;
img.classList.add('mse-decrypted');
img.classList.remove('loading');
console.log(`✅ 恢復縮圖 ${index}:${stateInfo.originalSrc}`);
}else{
console.log(`⚠️ 跳過縮圖 ${index}:路徑不匹配 ${expectedSrc}!==${stateInfo.originalSrc}`);
}
}
}
});
console.log(`📦 恢復了 ${decryptedStates.size}個已解密縮圖狀態中的有效項目`);
}
updateThumbnailSelection();
bindThumbnailClickEvents();
if(elements.thumbnailsContainer&&_0xe818){
elements.thumbnailsContainer.classList.add('visible');
}
renderThumbnails._isRendering=false;
return;
}
elements.thumbnails.innerHTML='';
if(!currentEvent?.media||currentEvent.media.length===0){
const noMediaDiv=document.createElement('div');
noMediaDiv.className='no-media-message';
noMediaDiv.textContent='此事件沒有媒體檔案';
noMediaDiv.style.cssText='color:#9ca3af;font-size:0.8rem;padding:1rem;text-align:center;';
elements.thumbnails.appendChild(noMediaDiv);
thumbnailCache.set(cacheKey,elements.thumbnails.innerHTML);
if(elements.thumbnailsContainer&&_0xe818){
elements.thumbnailsContainer.classList.add('visible');
}
renderThumbnails._isRendering=false;
return;
}
const fragment=document.createDocumentFragment();
currentEvent.media.forEach((media,index)=>{
const thumbnail=document.createElement('div');
thumbnail.className=`thumbnail ${index===_0x68ac ? 'active':''}`;
if(media.type==='image'||media.media_type==='image'){
const img=document.createElement('img');
const mediaSrc=media.src||media.url||(media.filename ? `./media/${media.filename}`:null);
if(!mediaSrc||mediaSrc.includes('null')){
console.warn('⚠️ 跳過縮圖無效媒體路徑:',media);
return;
}
if(mediaSrc.includes('media/')){
img.setAttribute('data-needs-mse-decrypt','true');
if(mediaSrc&&!mediaSrc.includes('null')&&mediaSrc!=='null'){
img.setAttribute('data-original-src',mediaSrc);
}else{
console.error('🚫 阻止設置縮圖無效的 data-original-src:',mediaSrc);
return;
}
img.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmOWZhZmIiLz48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAzMCAzMDszNjAgMzAgMzAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
}else{
img.src=mediaSrc;
}
thumbnail.appendChild(img);
}else if(media.type==='video'||media.media_type==='video'){
const videoIcon=document.createElement('div');
videoIcon.innerHTML='🎥';
videoIcon.style.cssText='display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:20px;';
thumbnail.appendChild(videoIcon);
}
fragment.appendChild(thumbnail);
});
elements.thumbnails.appendChild(fragment);
const contentToCache=elements.thumbnails.innerHTML;
if(contentToCache.includes('<div id="thumbnails"')){
console.error('❌ 檢測到嵌套的 thumbnails 容器，快取被汙染！');
}else{
thumbnailCache.set(cacheKey,contentToCache);
}
if(thumbnailCache.size>20){
const firstKey=thumbnailCache.keys().next().value;
thumbnailCache.delete(firstKey);
thumbnailDecryptedState.delete(firstKey);
}
bindThumbnailClickEvents();
if(elements.thumbnailsContainer){
if(_0xe818){
elements.thumbnailsContainer.classList.add('visible');
}else{
elements.thumbnailsContainer.classList.remove('visible');
console.log('📦 縮圖已渲染但保持隱藏狀態，可用作快取');
}
}
adjustThumbnailContainerWidth();
updateThumbnailSelection();
setTimeout(()=>{
const needsDecryptImages=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.fast-loaded)');
if(needsDecryptImages.length>0){
quickDecryptMedia();
}else{
}
setupDecryptionStateListener(cacheKey);
},100);
renderThumbnails._isRendering=false;
}
function setupDecryptionStateListener(cacheKey){
if(!cacheKey)return;
const checkInterval=setInterval(()=>{
const thumbnails=elements.thumbnails?.querySelectorAll('.thumbnail img');
if(!thumbnails||thumbnails.length===0){
clearInterval(checkInterval);
return;
}
const decryptedStates=new Map();
let allDecrypted=true;
let hasDecrypted=false;
thumbnails.forEach((img,index)=>{
if(img.classList.contains('mse-decrypted')&&img.src.startsWith('blob:')){
const originalSrc=img.getAttribute('data-original-src')||img.getAttribute('data-src')||'';
decryptedStates.set(index,{
blobUrl:img.src,
originalSrc:originalSrc
});
hasDecrypted=true;
}else if(img.hasAttribute('data-needs-mse-decrypt')){
allDecrypted=false;
}
});
if(hasDecrypted){
thumbnailDecryptedState.set(cacheKey,decryptedStates);
console.log(`💾 保存解密狀態:${decryptedStates.size}/${thumbnails.length}張縮圖`);
}
if(allDecrypted){
clearInterval(checkInterval);
console.log(`✅ 縮圖解密完成，停止監聽:${cacheKey}`);
}
},500);
setTimeout(()=>{
clearInterval(checkInterval);
},5000);
}
function loadEvent(){
const currentEvent=getCurrentEvent();
if(!currentEvent)return;
updateNavigationButtons();
if(elements.currentMemoirTitle&&MEMOIR_DATA){
elements.currentMemoirTitle.textContent=MEMOIR_DATA.chinese_name||MEMOIR_DATA.name||MEMOIR_DATA.title||'未命名回憶錄';
}
if(elements.currentEventDate){
if(currentEvent.date){
const date=new Date(currentEvent.date);
const formattedDate=date.toLocaleDateString('zh-TW',{
year:'numeric',
month:'long',
day:'numeric'
});
elements.currentEventDate.textContent=formattedDate;
}else{
elements.currentEventDate.textContent='日期未設定';
}
}else{
}
updateInfoDisplay();
fadeTransition(elements.mediaDisplay,()=>{
displayMedia();
});
renderThumbnails();
renderTimeline();
setTimeout(()=>{
preloadEventMedia();
},500);
setTimeout(()=>{
cleanupInvalidDataOriginalSrc();
const needsDecryptImages=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not(.fast-loaded)');
if(needsDecryptImages.length>0){
quickDecryptMedia();
}
},10);
currentEventId=`${_0x5678}-${Date.now()}`;
if(elements.eventDescription){
elements.eventDescription.textContent='';
elements.eventDescription.classList.remove('typewriter-cursor');
}
const description=currentEvent.description||'';
if(description&&elements.eventDescription){
if(_0x9f48){
typewriterEffect(elements.eventDescription,description,_0xb17c,currentEventId);
}else{
elements.eventDescription.textContent=description;
}
}
setTimeout(()=>{
if(_0xe818){
renderThumbnails();
}
},100);
}
function updateNavigationButtons(){
const currentEvent=getCurrentEvent();
if(elements.prevEventBtn){
elements.prevEventBtn.disabled=_0x5678===0;
}
if(elements.nextEventBtn){
elements.nextEventBtn.disabled=_0x5678===MEMOIR_DATA.timeline_events.length-1;
}
if(elements.prevMediaBtn){
elements.prevMediaBtn.disabled=_0x68ac===0;
}
if(elements.nextMediaBtn){
elements.nextMediaBtn.disabled=!currentEvent?.media||_0x68ac===currentEvent.media.length-1;
}
[elements.prevEventBtn,elements.nextEventBtn,elements.prevMediaBtn,elements.nextMediaBtn].forEach(btn=>{
if(btn&&!btn.classList.contains('touch-feedback')){
addTouchFeedback(btn);
}
});
document.querySelectorAll('.floating-btn').forEach(btn=>{
if(!btn.classList.contains('touch-feedback')){
addTouchFeedback(btn);
}
});
}
if(elements.prevEventBtn){
elements.prevEventBtn.addEventListener('click',()=>{
if(_0x5678>0){
jumpToEvent(_0x5678-1);
closeTimelinePanel();
}
});
}
if(elements.nextEventBtn){
elements.nextEventBtn.addEventListener('click',()=>{
if(_0x5678<MEMOIR_DATA.timeline_events.length-1){
jumpToEvent(_0x5678+1);
closeTimelinePanel();
}
});
}
if(elements.prevMediaBtn){
elements.prevMediaBtn.addEventListener('click',()=>{
const currentEvent=getCurrentEvent();
if(currentEvent?.media&&_0x68ac>0){
_0x68ac--;
_0x7ae0=_0x68ac;
slideTransition(elements.mediaDisplay,'left',()=>{
displayMedia(true);
updateThumbnailSelection();
updateNavigationButtons();
if(elements.lightbox?.classList.contains('active')){
displayLightboxMedia();
updateLightboxNavigation();
}
},true);
}
});
}
if(elements.nextMediaBtn){
elements.nextMediaBtn.addEventListener('click',()=>{
const currentEvent=getCurrentEvent();
if(currentEvent?.media&&_0x68ac<currentEvent.media.length-1){
_0x68ac++;
_0x7ae0=_0x68ac;
slideTransition(elements.mediaDisplay,'right',()=>{
displayMedia(true);
updateThumbnailSelection();
updateNavigationButtons();
if(elements.lightbox?.classList.contains('active')){
displayLightboxMedia();
updateLightboxNavigation();
}
},true);
}
});
}
function toggleMenu(){
_0xd5e4=!_0xd5e4;
if(elements.menuDropdown){
elements.menuDropdown.classList.toggle('open',_0xd5e4);
}
if(elements.menuBtnIcon){
elements.menuBtnIcon.classList.toggle('open',_0xd5e4);
}
if(!_0xd5e4&&_0xfa4c){
closeFontSizeMenu();
}
}
function closeMenu(){
_0xd5e4=false;
if(elements.menuDropdown){
elements.menuDropdown.classList.remove('open');
}
if(elements.menuBtnIcon){
elements.menuBtnIcon.classList.remove('open');
}
closeFontSizeMenu();
closeTypewriterMenu();
}
function toggleThumbnails(){
_0xe818=!_0xe818;
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.toggle('visible',_0xe818);
}
if(elements.thumbnailBtn){
elements.thumbnailBtn.style.background=_0xe818
? 'var(--primary)'
:'var(--surface)';
}
updateInfoPosition();
if(_0xe818){
renderThumbnails();
}
}
function toggleThumbnailsCollapse(){
_0x1431c=!_0x1431c;
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.toggle('collapsed',_0x1431c);
}
if(elements.thumbnailToggleArrow){
elements.thumbnailToggleArrow.title=_0x1431c ? '展開縮圖列':'收合縮圖列';
const icon=elements.thumbnailToggleArrow.querySelector('i[data-lucide],svg[data-lucide]');
if(icon){
icon.remove();
const newIcon=document.createElement('i');
if(_0x1431c){
newIcon.setAttribute('data-lucide','chevron-down');
}else{
newIcon.setAttribute('data-lucide','chevron-up');
}
newIcon.style.width='32px';
newIcon.style.height='20px';
elements.thumbnailToggleArrow.appendChild(newIcon);
if(window.lucide){
window.lucide.createIcons();
}
}
if(_0x1431c){
elements.thumbnailToggleArrow.classList.add('collapsed');
}else{
elements.thumbnailToggleArrow.classList.remove('collapsed');
}
if(_0x11eb4){
elements.thumbnailToggleArrow.style.display='flex';
elements.thumbnailToggleArrow.style.visibility='visible';
elements.thumbnailToggleArrow.style.opacity='1';
}
}
}
function toggleTypewriterSpeedMenu(){
_0x10c80=!_0x10c80;
if(elements.typewriterSpeedDropdown){
elements.typewriterSpeedDropdown.classList.toggle('open',_0x10c80);
}
if(_0x10c80){
closeOtherMenus('typewriter');
}
}
function closeTypewriterSpeedMenu(){
_0x10c80=false;
if(elements.typewriterSpeedDropdown){
elements.typewriterSpeedDropdown.classList.remove('open');
}
}
function closeTypewriterMenu(){
closeTypewriterSpeedMenu();
}
function closeOtherMenus(exceptMenu=''){
if(exceptMenu!=='typewriter'){
_0x10c80=false;
if(elements.typewriterSpeedDropdown){
elements.typewriterSpeedDropdown.classList.remove('open');
}
}
if(exceptMenu!=='fontsize'){
_0xfa4c=false;
if(elements.fontSizeDropdown){
elements.fontSizeDropdown.classList.remove('open');
}
}
if(exceptMenu!=='theme'){
_0x18bec=false;
if(elements.themeDropdown){
elements.themeDropdown.classList.remove('open');
}
if(elements.themeOverlay){
elements.themeOverlay.classList.remove('show');
}
}
}
function toggleTypewriter(){
_0x9f48=!_0x9f48;
if(elements.typewriterToggleBtn){
elements.typewriterToggleBtn.style.background=_0x9f48
? 'var(--primary)'
:'var(--surface)';
}
}
function toggleThemeMenu(){
_0x18bec=!_0x18bec;
if(elements.themeDropdown){
elements.themeDropdown.classList.toggle('open',_0x18bec);
}
if(elements.themeOverlay){
elements.themeOverlay.classList.toggle('show',_0x18bec);
}
if(_0x18bec){
closeOtherMenus('theme');
}
}
function applyTheme(themeName){
if(!themeName||themeName==='undefined'){
themeName='default';
console.warn('⚠️ 主題名稱無效，使用預設主題:default');
}
document.body.classList.remove('theme-default','theme-forest','theme-ocean',
'theme-sunset','theme-lavender','theme-crimson');
document.body.setAttribute('data-theme',themeName);
if(themeName!=='default'){
document.body.classList.add(`theme-${themeName}`);
}
_0x1b054=themeName;
if(!arguments.callee.isInitializing){
localStorage.setItem('memoir-theme',themeName);
}
updateThemeOptions(themeName);
}
function updateThemeOptions(activeTheme){
const themeOptions=document.querySelectorAll('.theme-option');
themeOptions.forEach(option=>{
const isActive=option.dataset.theme===activeTheme;
option.classList.toggle('active',isActive);
});
}
function initializeThemeSystem(){
applyTheme.isInitializing=true;
applyTheme(_0x1b054);
applyTheme.isInitializing=false;
const themeOptions=document.querySelectorAll('.theme-option');
themeOptions.forEach(option=>{
option.addEventListener('click',(e)=>{
e.stopPropagation();
const themeName=option.dataset.theme;
applyTheme(themeName);
toggleThemeMenu();
});
});
if(elements.themeOverlay){
elements.themeOverlay.addEventListener('click',()=>{
toggleThemeMenu();
});
}
}
function setTypingSpeed(speed){
_0xb17c=parseInt(speed);
localStorage.setItem('memoirflow:typing-speed',_0xb17c);
const speedSlider=document.getElementById('typingSpeedSlider');
const currentSpeedValue=document.getElementById('currentSpeedValue');
if(speedSlider)speedSlider.value=speed;
if(currentSpeedValue)currentSpeedValue.textContent=speed;
if(_0x9f48){
const currentEvent=getCurrentEvent();
const description=currentEvent?.description||'';
if(description&&elements.eventDescription){
elements.eventDescription.textContent='';
elements.eventDescription.classList.remove('typewriter-cursor');
currentEventId=`${_0x5678}-${Date.now()}`;
typewriterEffect(elements.eventDescription,description,_0xb17c,currentEventId);
}
}
}
function initializeTypingSpeedSlider(){
const speedSlider=document.getElementById('typingSpeedSlider');
const currentSpeedValue=document.getElementById('currentSpeedValue');
if(speedSlider){
speedSlider.value=_0xb17c;
speedSlider.addEventListener('input',(e)=>{
setTypingSpeed(e.target.value);
});
}
if(currentSpeedValue){
currentSpeedValue.textContent=_0xb17c;
}
}
function initializeToggleButtons(){
if(elements.typewriterToggleBtn){
elements.typewriterToggleBtn.style.background=_0x9f48
? 'var(--primary)'
:'var(--surface)';
}
if(elements.thumbnailBtn){
elements.thumbnailBtn.style.background=_0xe818
? 'var(--primary)'
:'var(--surface)';
}
}
function initializeHideButtons(){
if(elements.hideControlsBtn){
elements.hideControlsBtn.style.background=!_0x16784
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideControlsBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',_0x16784 ? 'move-diagonal':'move');
}
elements.hideControlsBtn.title=_0x16784 ? '顯示導航箭頭':'隱藏導航箭頭';
}
if(elements.hideDateBtn){
elements.hideDateBtn.style.background=!_0x179b8
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideDateBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',_0x179b8 ? 'calendar-x':'calendar-plus');
}
elements.hideDateBtn.title=_0x179b8 ? '顯示日期標籤':'隱藏日期標籤';
}
if(elements.hideTitleBtn){
elements.hideTitleBtn.style.background=!isTitleHidden
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideTitleBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',isTitleHidden ? 'file-x':'file-text');
}
elements.hideTitleBtn.title=isTitleHidden ? '顯示回憶錄名稱':'隱藏回憶錄名稱';
}
updateInfoDisplay();
if(window.lucide){
lucide.createIcons();
}
}
function applyDefaultSettings(){
if(_0xe818){
showThumbnails();
}else{
hideThumbnails();
}
if(_0x9f48){
}
setFontSize(_0xc3b0);
const floatingControls=document.querySelectorAll('.floating-controls:not(.nav-top)');
floatingControls.forEach(control=>{
if(_0x16784){
control.classList.add('controls-hidden');
}else{
control.classList.remove('controls-hidden');
}
});
if(elements.subtitleToggleBtn){
elements.subtitleToggleBtn.style.opacity='1';
elements.subtitleToggleBtn.style.pointerEvents='auto';
}
if(_0x179b8){
hideDateDisplay();
}else{
showDateDisplay();
}
}
function showThumbnails(){
if(elements.thumbnailContainer){
elements.thumbnailContainer.classList.remove('hidden');
_0xe818=true;
renderThumbnails();
if(elements.thumbnailBtn){
elements.thumbnailBtn.style.background='var(--primary)';
}
}
}
function hideThumbnails(){
if(elements.thumbnailContainer){
elements.thumbnailContainer.classList.add('hidden');
_0xe818=false;
if(elements.thumbnailBtn){
elements.thumbnailBtn.style.background='rgba(107,114,128,0.8)';
}
console.log('💡 縮圖列已隱藏，但保持DOM結構以供快取使用');
}
}
function showControlsTemporarily(){
if(elements.controlsContainer){
elements.controlsContainer.classList.remove('hidden');
_0x16784=false;
}
}
function hideControlsTemporarily(){
if(elements.controlsContainer){
elements.controlsContainer.classList.add('hidden');
_0x16784=true;
}
}
function showDateDisplay(){
const dateDisplay=document.getElementById('currentDateDisplay');
if(dateDisplay){
dateDisplay.classList.remove('date-hidden');
_0x179b8=false;
}
}
function hideDateDisplay(){
const dateDisplay=document.getElementById('currentDateDisplay');
if(dateDisplay){
dateDisplay.classList.add('date-hidden');
_0x179b8=true;
}
}
function updateSpeedLabel(speed){
const speedLabel=document.querySelector('.speed-label');
if(!speedLabel)return;
if(speed<=30){
speedLabel.textContent='快速';
}else if(speed<=60){
speedLabel.textContent='中等';
}else{
speedLabel.textContent='慢速';
}
}
function toggleSubtitle(){
_0x15550=!_0x15550;
if(elements.subtitleToggleBtn){
const icon=elements.subtitleToggleBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',_0x15550 ? 'eye':'eye-off');
lucide.createIcons();
}
elements.subtitleToggleBtn.title=_0x15550 ? '隱藏字幕':'顯示字幕';
elements.subtitleToggleBtn.classList.toggle('hidden',false);
}
if(elements.descriptionContainer){
elements.descriptionContainer.classList.toggle('subtitle-hidden',!_0x15550);
}
document.body.classList.toggle('subtitle-hidden-mode',!_0x15550);
if(_0x15550&&_0x9f48){
const currentEvent=getCurrentEvent();
const description=currentEvent?.description||'';
if(description&&elements.eventDescription){
elements.eventDescription.textContent='';
elements.eventDescription.classList.remove('typewriter-cursor');
currentEventId=`${_0x5678}-${Date.now()}`;
typewriterEffect(elements.eventDescription,description,_0xb17c,currentEventId);
}
}else if(_0x15550&&!_0x9f48){
const currentEvent=getCurrentEvent();
const description=currentEvent?.description||'';
if(description&&elements.eventDescription){
elements.eventDescription.textContent=description;
}
}
}
function toggleFontSizeMenu(){
_0xfa4c=!_0xfa4c;
if(elements.fontSizeDropdown){
elements.fontSizeDropdown.classList.toggle('open',_0xfa4c);
}
if(_0xfa4c){
closeOtherMenus('fontsize');
}
}
function closeFontSizeMenu(){
_0xfa4c=false;
if(elements.fontSizeDropdown){
elements.fontSizeDropdown.classList.remove('open');
}
}
function toggleControls(){
_0x16784=!_0x16784;
const floatingControls=document.querySelectorAll('.floating-controls:not(.nav-top)');
floatingControls.forEach(control=>{
control.classList.toggle('controls-hidden',_0x16784);
});
if(elements.subtitleToggleBtn){
elements.subtitleToggleBtn.style.opacity='1';
elements.subtitleToggleBtn.style.visibility='visible';
elements.subtitleToggleBtn.style.pointerEvents='auto';
}
if(elements.hideControlsBtn){
elements.hideControlsBtn.style.background=!_0x16784
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideControlsBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',_0x16784 ? 'move-diagonal':'move');
lucide.createIcons();
}
elements.hideControlsBtn.title=_0x16784 ? '顯示導航箭頭':'隱藏導航箭頭';
}
}
function toggleDateDisplay(){
_0x179b8=!_0x179b8;
updateInfoDisplay();
if(elements.hideDateBtn){
elements.hideDateBtn.style.background=!_0x179b8
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideDateBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',_0x179b8 ? 'calendar-x':'calendar-plus');
lucide.createIcons();
}
elements.hideDateBtn.title=_0x179b8 ? '顯示日期標籤':'隱藏日期標籤';
}
}
function toggleTitleDisplay(){
isTitleHidden=!isTitleHidden;
updateInfoDisplay();
if(elements.hideTitleBtn){
elements.hideTitleBtn.style.background=!isTitleHidden
? 'var(--primary)'
:'var(--surface)';
const icon=elements.hideTitleBtn.querySelector('i[data-lucide]');
if(icon){
icon.setAttribute('data-lucide',isTitleHidden ? 'file-x':'file-text');
lucide.createIcons();
}
elements.hideTitleBtn.title=isTitleHidden ? '顯示回憶錄名稱':'隱藏回憶錄名稱';
}
}
function updateInfoDisplay(){
const currentInfoDisplay=document.getElementById('currentInfoDisplay');
if(!currentInfoDisplay)return;
if(_0x179b8&&isTitleHidden){
currentInfoDisplay.style.display='none';
}else{
currentInfoDisplay.style.display='flex';
if(elements.currentMemoirTitle){
elements.currentMemoirTitle.style.display=isTitleHidden ? 'none':'block';
}
if(elements.currentEventDate){
elements.currentEventDate.style.display=_0x179b8 ? 'none':'block';
}
}
}
function updateInfoPosition(){
const currentInfoDisplay=document.getElementById('currentInfoDisplay');
if(currentInfoDisplay){
currentInfoDisplay.classList.toggle('below-thumbnails',_0xe818);
}
}
function setFontSize(size){
_0xc3b0=parseFloat(size);
if(elements.descriptionContainer){
elements.descriptionContainer.style._0xc3b0=_0xc3b0+'rem';
}
const fontSlider=document.getElementById('fontSizeSlider');
const currentFontValue=document.getElementById('currentFontValue');
if(fontSlider)fontSlider.value=size;
if(currentFontValue)currentFontValue.textContent=size+'x';
}
if(elements.menuBtn){
elements.menuBtn.addEventListener('click',toggleMenu);
addTouchFeedback(elements.menuBtn);
}
if(elements.timelineBtn){
elements.timelineBtn.addEventListener('click',()=>{
debounceButtonClick('timeline',()=>{
toggleTimelinePanel();
closeMenu();
},200);
});
addTouchFeedback(elements.timelineBtn);
}
if(elements.typewriterToggleBtn){
elements.typewriterToggleBtn.addEventListener('click',()=>{
debounceButtonClick('typewriter-toggle',toggleTypewriter,200);
});
addTouchFeedback(elements.typewriterToggleBtn);
}
if(elements.typewriterSpeedBtn){
elements.typewriterSpeedBtn.addEventListener('click',()=>{
debounceButtonClick('typewriter-speed',toggleTypewriterSpeedMenu,200);
});
addTouchFeedback(elements.typewriterSpeedBtn);
}
if(elements.thumbnailBtn){
elements.thumbnailBtn.addEventListener('click',toggleThumbnails);
addTouchFeedback(elements.thumbnailBtn);
}
if(elements.thumbnailToggleArrow){
elements.thumbnailToggleArrow.addEventListener('click',toggleThumbnailsCollapse);
addTouchFeedback(elements.thumbnailToggleArrow);
}
if(elements.fontSizeBtn){
elements.fontSizeBtn.addEventListener('click',()=>{
debounceButtonClick('fontsize',toggleFontSizeMenu,200);
});
addTouchFeedback(elements.fontSizeBtn);
}
if(elements.hideControlsBtn){
elements.hideControlsBtn.addEventListener('click',()=>{
debounceButtonClick('hide-controls',toggleControls,200);
});
addTouchFeedback(elements.hideControlsBtn);
}
if(elements.hideDateBtn){
elements.hideDateBtn.addEventListener('click',()=>{
debounceButtonClick('hide-date',toggleDateDisplay,200);
});
addTouchFeedback(elements.hideDateBtn);
}
if(elements.hideTitleBtn){
elements.hideTitleBtn.addEventListener('click',()=>{
debounceButtonClick('hide-title',toggleTitleDisplay,200);
});
addTouchFeedback(elements.hideTitleBtn);
}
if(elements.themeBtn){
elements.themeBtn.addEventListener('click',()=>{
debounceButtonClick('theme',toggleThemeMenu,200);
});
addTouchFeedback(elements.themeBtn);
}
if(elements.subtitleToggleBtn){
elements.subtitleToggleBtn.addEventListener('click',toggleSubtitle);
addTouchFeedback(elements.subtitleToggleBtn);
}
function initializeFontSizeSlider(){
const fontSlider=document.getElementById('fontSizeSlider');
const currentFontValue=document.getElementById('currentFontValue');
if(fontSlider){
fontSlider.value=_0xc3b0;
fontSlider.addEventListener('input',(e)=>{
setFontSize(e.target.value);
});
}
if(currentFontValue){
currentFontValue.textContent=_0xc3b0+'x';
}
}
if(elements.closeTimelineBtn){
elements.closeTimelineBtn.addEventListener('click',closeTimelinePanel);
}
document.addEventListener('click',(e)=>{
if(elements.timelinePanel&&
elements.timelinePanel.classList.contains('open')&&
!elements.timelinePanel.contains(e.target)&&
e.target!==elements.timelineBtn){
closeTimelinePanel();
}
if(_0xfa4c&&
elements.fontSizeDropdown&&
!elements.fontSizeDropdown.contains(e.target)&&
e.target!==elements.fontSizeBtn){
closeFontSizeMenu();
}
if(_0x10c80&&
elements.typewriterSpeedDropdown&&
!elements.typewriterSpeedDropdown.contains(e.target)&&
e.target!==elements.typewriterSpeedBtn){
closeTypewriterSpeedMenu();
}
if(_0xd5e4&&
elements.menuDropdown&&
!elements.menuDropdown.contains(e.target)&&
!elements.menuBtn.contains(e.target)&&
e.target!==elements.timelineBtn){
closeMenu();
}
});
document.addEventListener('keydown',(e)=>{
if(e.target.tagName==='INPUT')return;
switch(e.key){
case 'ArrowLeft':
if(elements.prevMediaBtn)elements.prevMediaBtn.click();
break;
case 'ArrowRight':
if(elements.nextMediaBtn)elements.nextMediaBtn.click();
break;
case 'ArrowUp':
if(elements.prevEventBtn)elements.prevEventBtn.click();
break;
case 'ArrowDown':
if(elements.nextEventBtn)elements.nextEventBtn.click();
break;
case 'Escape':
closeTimelinePanel();
closeMenu();
break;
case 't':
case 'T':
toggleTimelinePanel();
break;
case 'm':
case 'M':
toggleMenu();
break;
}
});
function openLightbox(mediaElement){
if(!elements.lightbox||!elements.lightboxMedia)return;
const currentEvent=getCurrentEvent();
if(!currentEvent?.media)return;
_0x11eb4=true;
_0x130e8=_0xe818;
_0x7ae0=_0x68ac;
if(!_0xe818){
toggleThumbnails();
}else{
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.add('visible');
}
renderThumbnails();
}
displayLightboxMedia();
updateLightboxNavigation();
elements.lightbox.classList.add('active');
if(elements.thumbnailToggleArrow){
elements.thumbnailToggleArrow.style.display='flex';
elements.thumbnailToggleArrow.style.visibility='visible';
elements.thumbnailToggleArrow.style.opacity='1';
elements.thumbnailToggleArrow.classList.add('lightbox-mode');
const icon=elements.thumbnailToggleArrow.querySelector('i[data-lucide],svg[data-lucide]');
if(icon){
icon.remove();
const newIcon=document.createElement('i');
newIcon.setAttribute('data-lucide',_0x1431c ? 'chevron-down':'chevron-up');
newIcon.style.width='32px';
newIcon.style.height='20px';
elements.thumbnailToggleArrow.appendChild(newIcon);
if(window.lucide){
window.lucide.createIcons();
}
}
elements.thumbnailToggleArrow.title=_0x1431c ? '展開縮圖列':'收合縮圖列';
if(_0x1431c){
elements.thumbnailToggleArrow.classList.add('collapsed');
}else{
elements.thumbnailToggleArrow.classList.remove('collapsed');
}
}
document.body.style.overflow='hidden';
}
function closeLightbox(){
if(!elements.lightbox)return;
_0x11eb4=false;
if(!_0x130e8&&_0xe818){
toggleThumbnails();
}
if(_0xe818&&_0x1431c){
_0x1431c=false;
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.remove('collapsed');
}
setTimeout(()=>{
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.style.transform='';
}
},100);
}
elements.lightbox.classList.remove('active');
document.body.style.overflow='';
if(elements.thumbnailToggleArrow){
elements.thumbnailToggleArrow.style.display='none';
elements.thumbnailToggleArrow.style.visibility='hidden';
elements.thumbnailToggleArrow.style.opacity='0';
elements.thumbnailToggleArrow.classList.remove('lightbox-mode');
}
if(elements.lightboxMedia){
elements.lightboxMedia.innerHTML='';
}
}
function displayLightboxMedia(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media||!elements.lightboxMedia)return;
const media=currentEvent.media[_0x7ae0];
if(!media)return;
elements.lightboxMedia.innerHTML='';
let mediaElement;
if(media.type==='image'||media.media_type==='image'){
mediaElement=document.createElement('img');
mediaElement.alt='回憶錄圖片';
const mediaSrc=media.src||media.url||(media.filename ? `./media/${media.filename}`:null);
if(!mediaSrc||mediaSrc.includes('null')){
console.warn('⚠️ 跳過燈箱無效媒體路徑:',media);
elements.lightboxMedia.innerHTML='<div style="color:white;text-align:center;">媒體檔案路徑無效</div>';
return;
}
if(mediaSrc.includes('media/')){
mediaElement.setAttribute('data-needs-mse-decrypt','true');
if(mediaSrc&&!mediaSrc.includes('null')&&mediaSrc!=='null'){
mediaElement.setAttribute('data-original-src',mediaSrc);
}else{
console.error('🚫 阻止設置燈箱無效的 data-original-src:',mediaSrc);
return;
}
mediaElement.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI4IiBmaWxsPSJub25lIiBzdHJva2U9IiMzYjgyZjYiIHN0cm9rZS13aWR0aD0iMiI+PGFuaW1hdGVUcmFuc2Zvcm0gYXR0cmlidXRlTmFtZT0idHJhbnNmb3JtIiB0eXBlPSJyb3RhdGUiIHZhbHVlcz0iMCAyMCAyMDszNjAgMjAgMjAiIGR1cj0iMXMiIHJlcGVhdENvdW50PSJpbmRlZmluaXRlIi8+PC9jaXJjbGU+PC9zdmc+';
setTimeout(quickDecryptMedia,10);
}else{
mediaElement.src=mediaSrc;
}
}else if(media.type==='video'||media.media_type==='video'){
mediaElement=document.createElement('video');
mediaElement.controls=true;
mediaElement.src=media.src||media.url||(media.filename ? `./media/${media.filename}`:'');
}
if(mediaElement){
elements.lightboxMedia.appendChild(mediaElement);
}
updateLightboxNavigation();
}
function updateLightboxNavigation(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media)return;
if(elements.lightboxPrev){
elements.lightboxPrev.style.display=_0x7ae0>0 ? 'block':'none';
}
if(elements.lightboxNext){
elements.lightboxNext.style.display=_0x7ae0<currentEvent.media.length-1 ? 'block':'none';
}
}
function lightboxPrevMedia(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media||_0x7ae0<=0)return;
_0x7ae0--;
_0x68ac=_0x7ae0;
displayLightboxMedia();
displayMedia();
updateThumbnailSelection();
}
function lightboxNextMedia(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media||_0x7ae0>=currentEvent.media.length-1)return;
_0x7ae0++;
_0x68ac=_0x7ae0;
displayLightboxMedia();
displayMedia();
updateThumbnailSelection();
}
if(elements.lightboxClose){
elements.lightboxClose.addEventListener('click',closeLightbox);
}
if(elements.lightboxPrev){
elements.lightboxPrev.addEventListener('click',lightboxPrevMedia);
}
if(elements.lightboxNext){
elements.lightboxNext.addEventListener('click',lightboxNextMedia);
}
if(elements.lightbox){
elements.lightbox.addEventListener('click',(e)=>{
if(e.target===elements.lightbox){
closeLightbox();
}
});
}
document.addEventListener('keydown',(e)=>{
if(!elements.lightbox?.classList.contains('active'))return;
switch(e.key){
case 'Escape':
closeLightbox();
break;
case 'ArrowLeft':
lightboxPrevMedia();
break;
case 'ArrowRight':
lightboxNextMedia();
break;
}
});
function normalizeDataStructure(data){
if(!data)return null;
if(data.timeline_events){
return data;
}
if(data.events&&Array.isArray(data.events)){
const converted={
...data,
timeline_events:data.events
};
return converted;
}
console.warn('⚠️ 無法識別的數據結構:',data);
return data;
}
function checkVersionAndSyncConfig(){
const currentVersionId=window.MEMOIR_VERSION_ID;
const defaultDisplayConfig=window.MEMOIR_DISPLAY_CONFIG;
if(!currentVersionId){
console.warn('⚠️ 未找到版本號，跳過版本檢查');
return;
}
const VERSION_KEY='memoirflow:last-version';
const savedVersionId=localStorage.getItem(VERSION_KEY);
if(currentVersionId!==savedVersionId){
if(defaultDisplayConfig){
if(typeof defaultDisplayConfig.theme==='string'){
if(_0x1b054!==defaultDisplayConfig.theme){
console.warn(`⚠️ 主題配置不一致，以部署配置為準:${defaultDisplayConfig.theme}`);
_0x1b054=defaultDisplayConfig.theme;
applyTheme(_0x1b054);
}
}
if(typeof defaultDisplayConfig._0xc3b0==='number'){
const fontValue=defaultDisplayConfig._0xc3b0;
const oldFontSize=actualFontSize;
actualFontSize=fontValue;
_0xc3b0=fontValue;
localStorage.setItem('memoir-font-size',String(actualFontSize));
setFontSize(actualFontSize);
}
if(typeof defaultDisplayConfig._0xb17c==='number'){
const oldTypingSpeed=actualTypingSpeed;
actualTypingSpeed=defaultDisplayConfig._0xb17c;
_0xb17c=defaultDisplayConfig._0xb17c;
localStorage.setItem('memoirflow:typing-speed',String(actualTypingSpeed));
}
if(typeof defaultDisplayConfig.thumbnailsVisible==='boolean'){
const oldThumbnailsVisible=actualThumbnailsVisible;
actualThumbnailsVisible=defaultDisplayConfig.thumbnailsVisible;
_0xe818=defaultDisplayConfig.thumbnailsVisible;
localStorage.setItem('memoir-thumbnails-visible',String(actualThumbnailsVisible));
if(elements.thumbnailsContainer){
elements.thumbnailsContainer.classList.toggle('visible',actualThumbnailsVisible);
}
}
}else{
console.warn('❌ 作者的顯示配置為空，無法同步');
}
localStorage.setItem(VERSION_KEY,currentVersionId);
}else{
}
}
function initializeApp(){
checkVersionAndSyncConfig();
if(!MEMOIR_DATA){
console.error('❌ MEMOIR_DATA 為空，無法初始化應用');
return;
}
MEMOIR_DATA=normalizeDataStructure(MEMOIR_DATA);
if(!MEMOIR_DATA){
console.error('❌ 數據正規化失敗');
return;
}
if(!MEMOIR_DATA.timeline_events){
console.error('❌ MEMOIR_DATA.timeline_events 不存在');
return;
}
elements.loadingScreen.classList.add('hidden');
elements.app.classList.remove('hidden');
if(MEMOIR_DATA.timeline_events.length>0){
renderTimeline();
loadEvent();
}else{
console.warn('⚠️ 沒有回憶錄事件可顯示');
elements.mediaDisplay.innerHTML='<div>此回憶錄沒有事件內容</div>';
}
initializeToggleButtons();
initializeTypingSpeedSlider();
initializeHideButtons();
initializeThemeSystem();
applyDefaultSettings();
updateInfoPosition();
}
window.onDecryptionSuccess=function(decryptedData){
MEMOIR_DATA=decryptedData;
initializeApp();
};
document.addEventListener('decryptionSuccess',function(event){
if(event.detail){
MEMOIR_DATA=event.detail;
const passwordModal=document.getElementById('passwordModal');
if(passwordModal){
passwordModal.classList.add('hidden');
}
initializeApp();
}
});
window.addEventListener('memoir:decrypted',function(event){
let memoirData=null;
if(event.detail&&event.detail.data){
memoirData=event.detail.data;
}else if(event.detail){
memoirData=event.detail;
}
if(memoirData){
window.MEMOIR_DATA=memoirData;
MEMOIR_DATA=memoirData;
const passwordModal=document.getElementById('passwordModal');
if(passwordModal){
passwordModal.classList.add('hidden');
}
initializeApp();
}
});
function setupPasswordModal(){
const unlockBtn=document.getElementById('unlockBtn');
const passwordInput=document.getElementById('memoirPassword');
const passwordModal=document.getElementById('passwordModal');
const passwordError=document.getElementById('passwordError');
if(!unlockBtn||!passwordInput)return;
const tryUnlock=async()=>{
const password=passwordInput.value.trim();
if(!password){
if(passwordError){
passwordError.textContent='請輸入密碼';
passwordError.classList.remove('hidden');
}
return;
}
unlockBtn.disabled=true;
unlockBtn.textContent='解鎖中...';
try{
let success=false;
let decryptedData=null;
if(typeof window.attemptDecryption==='function'){
const result=await window.attemptDecryption(password);
success=!!result;
decryptedData=result;
}else if(typeof window.decryptWithPassword==='function'){
const result=await window.decryptWithPassword(password);
success=!!result;
decryptedData=result;
}
if(success){
sessionStorage.setItem('mf_pw_unlocked','1');
if(passwordModal){
passwordModal.classList.add('hidden');
}
let finalData=null;
if(decryptedData){
finalData=decryptedData;
}else if(window.MEMOIR_DATA){
finalData=window.MEMOIR_DATA;
}
if(finalData){
window.MEMOIR_DATA=finalData;
MEMOIR_DATA=finalData;
if(typeof window.onDecryptionSuccess==='function'){
window.onDecryptionSuccess(MEMOIR_DATA);
}else{
initializeApp();
}
}else{
console.error('❌ 無法取得解密數據');
}
}else{
if(passwordError){
passwordError.textContent='密碼錯誤，請重新輸入';
passwordError.classList.remove('hidden');
}
passwordInput.value='';
passwordInput.focus();
}
}finally{
unlockBtn.disabled=false;
unlockBtn.textContent='解鎖查看';
}
};
unlockBtn.addEventListener('click',tryUnlock);
passwordInput.addEventListener('keypress',(e)=>{
if(e.key==='Enter'){
tryUnlock();
}
});
passwordInput.addEventListener('input',()=>{
if(passwordError){
passwordError.classList.add('hidden');
}
});
}
window.showPasswordPrompt=function(errorMessage=''){
const loadingScreen=document.getElementById('loadingScreen');
const passwordModal=document.getElementById('passwordModal');
const app=document.getElementById('app');
if(loadingScreen)loadingScreen.classList.add('hidden');
if(app)app.classList.add('hidden');
if(passwordModal){
passwordModal.classList.remove('hidden');
const errorDiv=document.getElementById('passwordError');
if(errorMessage&&errorDiv){
errorDiv.textContent=errorMessage;
errorDiv.classList.remove('hidden');
}else if(errorDiv){
errorDiv.classList.add('hidden');
}
const passwordInput=document.getElementById('memoirPassword');
if(passwordInput){
setTimeout(()=>passwordInput.focus(),100);
}
}
};
document.addEventListener('DOMContentLoaded',()=>{
const initialThumbnailElements=document.querySelectorAll('#thumbnails');
if(initialThumbnailElements.length>1){
console.error('❌ 嚴重錯誤：DOM中已存在多個 #thumbnails 元素！');
initialThumbnailElements.forEach((el,index)=>{
});
}
if(window.lucide){
lucide.createIcons();
}
setupPasswordModal();
setupTouchGestures();
initializeFontSizeSlider();
initializeToggleButtons();
if(typeof window.REQUIRE_PW!=='undefined'&&window.REQUIRE_PW&&!sessionStorage.getItem('mf_pw_unlocked')){
window.showPasswordPrompt();
}else if(window.MEMOIR_DATA){
MEMOIR_DATA=window.MEMOIR_DATA;
initializeApp();
}else{
}
setTimeout(()=>{
document.body.classList.add('fade-in');
},100);
});
let resizeTimeout;
window.addEventListener('resize',()=>{
clearTimeout(resizeTimeout);
resizeTimeout=setTimeout(()=>{
if(_0xe818&&elements.thumbnails){
adjustThumbnailContainerWidth();
console.debug('Window resized:adjusting thumbnail container width');
}
},150);
});
function preloadEventMedia(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media)return;
window.currentEventPreloadComplete=false;
console.log('🚀 開始積極預載當前事件的圖片，總數:',currentEvent.media.length);
let preloadedCount=0;
const totalImages=currentEvent.media.filter(media=>media&&(media.type==='image'||media.media_type==='image')).length;
currentEvent.media.forEach((media,index)=>{
if(media&&(media.type==='image'||media.media_type==='image')){
setTimeout(()=>{
const originalSrc=media.src||media.url||(media.filename ? `./media/${media.filename}`:null);
if(!originalSrc||originalSrc.includes('null')){
console.warn(`⚠️ 跳過無效媒體路徑:${index+1}/${currentEvent.media.length}`,media);
return;
}
const hiddenImg=document.createElement('img');
hiddenImg.style.display='none';
hiddenImg.style.position='absolute';
hiddenImg.style.left='-9999px';
hiddenImg.setAttribute('data-needs-mse-decrypt','true');
hiddenImg.setAttribute('data-preload-index',index.toString());
hiddenImg.setAttribute('data-event-index',_0x5678.toString());
let decryptComplete=false;
const handleSuccess=(blobUrl)=>{
if(!decryptComplete){
decryptComplete=true;
preloadedCount++;
console.log(`✅ 圖片預載完成:${index+1}/${currentEvent.media.length}(${preloadedCount}/${totalImages})`);
cacheImage(originalSrc,blobUrl);
cacheEventMedia(_0x5678,index,blobUrl);
setTimeout(()=>{
if(hiddenImg.parentNode){
hiddenImg.parentNode.removeChild(hiddenImg);
}
},500);
if(preloadedCount>=totalImages){
console.log('🎉 當前事件所有圖片預載完成！停止進一步的解密請求');
window.currentEventPreloadComplete=true;
}
}
};
hiddenImg.onload=()=>handleSuccess(hiddenImg.src);
hiddenImg.onerror=()=>{
console.log(`🔄 圖片需要解密處理:${index+1}/${currentEvent.media.length}`);
};
hiddenImg.addEventListener('mse-decrypt-complete',(event)=>{
if(event.detail&&event.detail.decryptedSrc){
handleSuccess(event.detail.decryptedSrc);
}
});
document.body.appendChild(hiddenImg);
hiddenImg.src=originalSrc;
setTimeout(()=>{
if(!decryptComplete&&!window.currentEventPreloadComplete&&typeof window.quickDecryptMedia==='function'){
console.log(`🔄 觸發單次解密檢查:${index+1}/${currentEvent.media.length}`);
window.quickDecryptMedia();
}
},500);
},index*50);
}
});
}
function preloadNextMedia(){
const currentEvent=getCurrentEvent();
if(!currentEvent?.media)return;
const nextIndex=_0x68ac+1;
if(nextIndex<currentEvent.media.length){
const nextMedia=currentEvent.media[nextIndex];
if(nextMedia&&(nextMedia.type==='image'||nextMedia.media_type==='image')){
const img=new Image();
img.src=nextMedia.src||nextMedia.url||(nextMedia.filename ? `./media/${nextMedia.filename}`:'');
}
}
}
setTimeout(preloadNextMedia,1000);
window.secureGlobals={
MEMOIR_DATA:null,
decryptionMode:null,
decryptionAttempts:0,
MAX_ATTEMPTS:5,
lastAccessTime:null,
sessionExpiry:null
};
window.secureUtils={
showDecryptionError:function(message){
console.error('🔒 解密錯誤:',message);
if(typeof window.showError==='function'){
window.showError(message);
}else{
alert('錯誤:'+message);
}
},
initializeApp:function(){
console.log('🚀 初始化應用程式');
if(typeof window.onMemoirDecrypted==='function'){
window.onMemoirDecrypted(secureGlobals.MEMOIR_DATA);
}else{
console.log('✅ 回憶錄解密完成，資料可用');
}
}
};
console.log('🔒 安全框架初始化完成');
(function(){
'use strict';
console.log('🔑 伺服器端金鑰模式載入');
window.autoDecrypt=async function(){
try{
const encEl=document.getElementById('enc-payload');
if(!encEl)throw new Error('找不到加密數據容器');
const encData=JSON.parse(encEl.textContent||'{}');
const{ciphertext_b64,iv_b64,salt_b64,aad}=encData;
if(!ciphertext_b64||!iv_b64||!salt_b64){
throw new Error('加密數據不完整');
}
console.log('✅ 加密數據驗證通過');
console.log('🔍 調試信息:',{
ciphertext_length:ciphertext_b64.length,
iv_length:iv_b64.length,
salt_length:salt_b64.length,
aad:aad
});
const response=await fetch('https://mastermaso.com/memoirflow/api/keys/retrieve',{
method:'POST',
headers:{
'Content-Type':'application/json',
'Accept':'application/json'
},
body:JSON.stringify({
memoir_id:'4548b929-5c16-4ee7-a189-60679e2165be',
session_id:'direct',
timestamp:new Date().toISOString()
})
});
if(!response.ok){
const errorText=await response.text();
throw new Error('無法獲取解密金鑰:HTTP '+response.status+'-'+errorText);
}
const result=await response.json();
console.log(`result=${JSON.stringify(result)}`)
if(!result.decryption_key){
throw new Error('伺服器回應中缺少解密金鑰');
}
console.log('✅ 金鑰獲取成功');
const keyB64=result.decryption_key;
console.log('🔍 原始金鑰長度:',keyB64.length);
const b64=keyB64.replace(/-/g,'+').replace(/_/g,'/');
const padLength=(4-(b64.length % 4))% 4;
const paddedB64=b64+'='.repeat(padLength);
console.log('🔍 處理後的 base64:',paddedB64.length);
const raw=atob(paddedB64);
const secretBytes=new Uint8Array([...raw].map(c=>c.charCodeAt(0)));
console.log('✅ 解密金鑰處理完成，長度:',secretBytes.length);
const salt=Uint8Array.from(atob(salt_b64),c=>c.charCodeAt(0));
console.log('🔍 Salt 長度:',salt.length);
const keyMat=await crypto.subtle.importKey('raw',secretBytes,'PBKDF2',false,['deriveKey']);
const aesKey=await crypto.subtle.deriveKey(
{name:'PBKDF2',salt,iterations:200000,hash:'SHA-256'},
keyMat,
{name:'AES-GCM',length:256},
false,
['decrypt']
);
console.log('✅ AES 密鑰推導完成');
const iv=Uint8Array.from(atob(iv_b64),c=>c.charCodeAt(0));
const ct=Uint8Array.from(atob(ciphertext_b64),c=>c.charCodeAt(0));
console.log('🔍 解密參數:',{
iv_length:iv.length,
ciphertext_length:ct.length,
has_aad:!!aad
});
const decryptAlgo=aad ?
{name:'AES-GCM',iv,additionalData:new TextEncoder().encode(aad)}:
{name:'AES-GCM',iv};
let decryptedBuffer;
try{
decryptedBuffer=await crypto.subtle.decrypt(decryptAlgo,aesKey,ct);
console.log('✅ AES-GCM 解密完成');
}catch(decryptError){
console.error('❌ AES-GCM 解密失敗:',decryptError);
if(aad){
console.log('🔄 嘗試不使用 AAD 解密...');
try{
decryptedBuffer=await crypto.subtle.decrypt(
{name:'AES-GCM',iv},
aesKey,
ct
);
console.log('✅ 無 AAD 解密成功');
}catch(noAadError){
throw new Error('解密失敗：金鑰不匹配或數據已損壞');
}
}else{
throw new Error('解密失敗：金鑰不匹配或數據已損壞');
}
}
const decryptedText=new TextDecoder().decode(new Uint8Array(decryptedBuffer));
let memoirData;
try{
memoirData=JSON.parse(decryptedText);
}catch(parseError){
throw new Error('解密後的數據格式無效');
}
if(!memoirData||typeof memoirData!=='object'){
throw new Error('解密後的回憶錄數據無效');
}
console.log('✅ 回憶錄數據解析成功:',{
id:memoirData.id,
name:memoirData.chinese_name,
eventsCount:memoirData.events?.length||0
});
window.MEMOIR_DATA=memoirData;
window.dispatchEvent(new CustomEvent('memoir:decrypted',{
detail:memoirData
}));
console.log('🎉 伺服器端金鑰解密完成');
return true;
}catch(error){
console.error('❌ 解密失敗:',error);
let errorMessage='unknown error';
if(error&&typeof error==='object'){
if(typeof error.message==='string'){
errorMessage=error.message;
}else if(typeof error.toString==='function'){
errorMessage=error.toString();
}
}else if(typeof error==='string'){
errorMessage=error;
}
if(errorMessage.includes('金鑰')||errorMessage.includes('key')){
errorMessage='解密金鑰獲取失敗，請檢查網路連接或聯繫管理員';
}else if(errorMessage.includes('decrypt')||errorMessage.includes('解密')){
errorMessage='內容解密失敗，可能是金鑰不匹配或數據已損壞';
}else if(errorMessage.includes('network')||errorMessage.includes('fetch')){
errorMessage='網路連接失敗，請檢查網路狀態後重試';
}
if(typeof window.showError==='function'){
window.showError('解密失敗:'+errorMessage);
}else{
alert('解密失敗:'+errorMessage);
}
return false;
}
};
console.log('✅ 伺服器端金鑰解密腳本準備完成');
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',function(){
console.log('🚀 DOM 載入完成，自動開始解密');
setTimeout(()=>{
if(typeof window.autoDecrypt==='function'){
window.autoDecrypt().catch(console.error);
}
},100);
});
}else{
console.log('🚀 DOM 已載入，立即開始解密');
setTimeout(()=>{
if(typeof window.autoDecrypt==='function'){
window.autoDecrypt().catch(console.error);
}
},100);
}
})();
(function(){
'use strict';
const MSE_OFFSET=37;
const GITHUB_BASE_URL='https://maso0310.github.io/memoir-developer-log/media/';
const CONFIG={
MAX_CONCURRENT_DECRYPT:8,
CACHE_SIZE:50,
PRELOAD_RANGE:3,
CHUNK_SIZE:64*1024,
PRIORITY_BOOST_MS:100,
MEMORY_CLEANUP_INTERVAL:30000,
INSTANT_LOAD_THRESHOLD:500,
};
class HybridDecryptionEngine{
constructor(){
this.workers=[];
this.workerCount=Math.min(4,navigator.hardwareConcurrency||2);
this.taskQueue=[];
this.busyWorkers=new Set();
this.workersAvailable=false;
this.fallbackMode=false;
this.initWorkers();
}
initWorkers(){
const workerCode=`
self.onmessage=function(e){
const{data,offset,taskId}=e.data;
try{
const result=new Uint8Array(data.length);
const offsetComplement=256-offset;
let i=0;
const len=data.length;
for(;i<len-3;i+=4){
result[i]=(data[i]+offsetComplement)& 255;
result[i+1]=(data[i+1]+offsetComplement)& 255;
result[i+2]=(data[i+2]+offsetComplement)& 255;
result[i+3]=(data[i+3]+offsetComplement)& 255;
}
for(;i<len;i++){
result[i]=(data[i]+offsetComplement)& 255;
}
self.postMessage({taskId,result,success:true});
}catch(error){
self.postMessage({taskId,error:error.message,success:false});
}
};
`;
try{
for(let i=0;i<this.workerCount;i++){
const blob=new Blob([workerCode],{type:'application/javascript'});
const worker=new Worker(URL.createObjectURL(blob));
worker.onmessage=(e)=>this.handleWorkerMessage(e,worker);
worker.onerror=(error)=>{
this.enableFallbackMode();
};
this.workers.push(worker);
}
if(this.workers.length>0){
this.workersAvailable=true;
}
}catch(error){
this.enableFallbackMode();
}
}
enableFallbackMode(){
this.fallbackMode=true;
this.workersAvailable=false;
this.workers.forEach(worker=>{
try{
worker.terminate();
}catch(e){
}
});
this.workers=[];
}
decryptOnMainThread(data){
const result=new Uint8Array(data.length);
const offsetComplement=256-MSE_OFFSET;
let i=0;
const len=data.length;
for(;i<len-3;i+=4){
result[i]=(data[i]+offsetComplement)& 255;
result[i+1]=(data[i+1]+offsetComplement)& 255;
result[i+2]=(data[i+2]+offsetComplement)& 255;
result[i+3]=(data[i+3]+offsetComplement)& 255;
}
for(;i<len;i++){
result[i]=(data[i]+offsetComplement)& 255;
}
return result;
}
async decrypt(data,taskId){
if(this.fallbackMode||!this.workersAvailable){
try{
const result=this.decryptOnMainThread(data);
return result;
}catch(error){
throw error;
}
}
return new Promise((resolve,reject)=>{
this.taskQueue.push({data,taskId,resolve,reject});
this.processQueue();
});
}
processQueue(){
if(this.fallbackMode||!this.workersAvailable){
while(this.taskQueue.length>0){
const task=this.taskQueue.shift();
try{
const result=this.decryptOnMainThread(task.data);
task.resolve(result);
}catch(error){
task.reject(error);
}
}
return;
}
while(this.taskQueue.length>0&&this.busyWorkers.size<this.workerCount){
const task=this.taskQueue.shift();
const worker=this.workers.find(w=>!this.busyWorkers.has(w));
if(worker){
this.busyWorkers.add(worker);
worker.currentTask=task;
worker.postMessage({
data:task.data,
offset:MSE_OFFSET,
taskId:task.taskId
});
}else{
this.taskQueue.unshift(task);
break;
}
}
}
handleWorkerMessage(e,worker){
const{taskId,result,success,error}=e.data;
const task=worker.currentTask;
this.busyWorkers.delete(worker);
worker.currentTask=null;
if(success){
task.resolve(result);
}else{
this.enableFallbackMode();
try{
const result=this.decryptOnMainThread(task.data);
task.resolve(result);
}catch(fallbackError){
task.reject(new Error(`Worker 和主線程解密都失敗:${error},${fallbackError.message}`));
}
}
this.processQueue();
}
destroy(){
this.workers.forEach(worker=>{
try{
worker.terminate();
}catch(e){
}
});
this.workers=[];
this.taskQueue=[];
this.busyWorkers.clear();
this.workersAvailable=false;
this.fallbackMode=false;
}
getStatus(){
return{
workersAvailable:this.workersAvailable,
fallbackMode:this.fallbackMode,
workerCount:this.workers.length,
queueLength:this.taskQueue.length,
busyWorkers:this.busyWorkers.size
};
}
}
class SmartDecryptCache{
constructor(){
this.cache=new Map();
this.priorities=new Map();
this.accessTimes=new Map();
this.blobUrls=new Map();
this.maxSize=CONFIG.CACHE_SIZE;
this.memoryUsage=0;
this.maxMemory=200*1024*1024;
}
set(key,data,priority=1){
if(this.cache.has(key)){
this.evict(key);
}
while(this.cache.size>=this.maxSize||this.memoryUsage>=this.maxMemory){
this.evictLRU();
}
const blob=new Blob([data]);
const blobUrl=URL.createObjectURL(blob);
this.cache.set(key,data);
this.blobUrls.set(key,blobUrl);
this.priorities.set(key,priority);
this.accessTimes.set(key,Date.now());
this.memoryUsage+=data.byteLength;
return blobUrl;
}
get(key){
if(this.cache.has(key)){
this.accessTimes.set(key,Date.now());
return this.blobUrls.get(key);
}
return null;
}
evict(key){
if(this.cache.has(key)){
const data=this.cache.get(key);
const blobUrl=this.blobUrls.get(key);
if(blobUrl){
URL.revokeObjectURL(blobUrl);
}
this.cache.delete(key);
this.blobUrls.delete(key);
this.priorities.delete(key);
this.accessTimes.delete(key);
this.memoryUsage-=data.byteLength;
}
}
evictLRU(){
let oldestKey=null;
let oldestTime=Date.now();
let lowestPriority=Infinity;
for(const[key,time]of this.accessTimes.entries()){
const priority=this.priorities.get(key)||1;
if(priority<lowestPriority||(priority===lowestPriority&&time<oldestTime)){
oldestTime=time;
oldestKey=key;
lowestPriority=priority;
}
}
if(oldestKey){
this.evict(oldestKey);
}
}
getStats(){
return{
size:this.cache.size,
maxSize:this.maxSize,
memoryUsage:this.memoryUsage,
maxMemory:this.maxMemory,
hitRate:this.hitRate||0
};
}
}
class PredictiveLoader{
constructor(){
this.viewportTracker=new Map();
this.scrollVelocity=0;
this.lastScrollTime=0;
this.lastScrollPosition=0;
this.loadQueue=[];
this.isProcessing=false;
this.setupScrollTracking();
}
setupScrollTracking(){
let scrollTimeout;
window.addEventListener('scroll',()=>{
const now=Date.now();
const currentPosition=window.scrollY;
if(this.lastScrollTime>0){
const timeDelta=now-this.lastScrollTime;
const positionDelta=currentPosition-this.lastScrollPosition;
this.scrollVelocity=Math.abs(positionDelta/timeDelta);
}
this.lastScrollTime=now;
this.lastScrollPosition=currentPosition;
clearTimeout(scrollTimeout);
scrollTimeout=setTimeout(()=>{
this.scrollVelocity=0;
this.predictAndLoad();
},150);
},{passive:true});
}
predictAndLoad(){
const images=document.querySelectorAll('img[data-needs-mse-decrypt]:not(.mse-decrypted)');
const predictions=[];
images.forEach(img=>{
const rect=img.getBoundingClientRect();
const distanceFromViewport=Math.max(0,rect.top-window.innerHeight);
const adjustedRange=CONFIG.PRELOAD_RANGE*(1+this.scrollVelocity*0.1);
const predictedViewTime=distanceFromViewport/(this.scrollVelocity*16+50);
if(predictedViewTime<adjustedRange*1000){
const priority=Math.max(1,5-Math.floor(predictedViewTime/200));
predictions.push({img,priority,predictedTime:predictedViewTime});
}
});
predictions
.sort((a,b)=>a.predictedTime-b.predictedTime)
.forEach(prediction=>{
this.queueLoad(prediction.img,prediction.priority);
});
}
queueLoad(img,priority){
const src=img.getAttribute('data-original-src')||img.src;
if(!src||this.loadQueue.some(item=>item.src===src)){
return;
}
this.loadQueue.push({img,src,priority,timestamp:Date.now()});
this.loadQueue.sort((a,b)=>b.priority-a.priority);
if(!this.isProcessing){
this.processQueue();
}
}
async processQueue(){
this.isProcessing=true;
while(this.loadQueue.length>0){
const concurrentTasks=[];
const maxConcurrent=Math.min(CONFIG.MAX_CONCURRENT_DECRYPT,this.loadQueue.length);
for(let i=0;i<maxConcurrent;i++){
const task=this.loadQueue.shift();
if(task){
concurrentTasks.push(this.processTask(task));
}
}
if(concurrentTasks.length>0){
await Promise.allSettled(concurrentTasks);
}
await new Promise(resolve=>setTimeout(resolve,1));
}
this.isProcessing=false;
}
async processTask(task){
const{img,src,priority}=task;
try{
const blobUrl=await decryptImageUltraFast(src,priority);
if(blobUrl&&img.parentNode){
img.src=blobUrl;
img.classList.add('mse-decrypted');
img.classList.remove('loading','decrypting');
const thumbnail=img.closest('.thumbnail');
if(thumbnail){
thumbnail.classList.add('loaded');
thumbnail.classList.remove('loading');
}
}
}catch(error){
img.classList.add('decrypt-error');
}
}
}
const hybridEngine=new HybridDecryptionEngine();
const smartCache=new SmartDecryptCache();
const predictiveLoader=new PredictiveLoader();
async function decryptImageUltraFast(src,priority=1){
const startTime=Date.now();
if(!src||src.includes('null')||src==='null'){
console.warn('🚫 阻止解密無效src路徑:',src);
throw new Error('Invalid src path:'+src);
}
const cached=smartCache.get(src);
if(cached){
return cached;
}
try{
const fetchOptions={
method:'GET',
cache:priority>3 ? 'force-cache':'default',
priority:priority>3 ? 'high':'auto'
};
const response=await fetch(src,fetchOptions);
if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}
const encryptedData=new Uint8Array(await response.arrayBuffer());
const taskId=`task_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
const decryptedData=await hybridEngine.decrypt(encryptedData,taskId);
const blobUrl=smartCache.set(src,decryptedData,priority);
const totalTime=Date.now()-startTime;
return blobUrl;
}catch(error){
throw error;
}
}
function setupIntelligentImageObserver(){
const observer=new IntersectionObserver((entries)=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
const img=entry.target;
const src=img.getAttribute('data-original-src')||img.src;
if(src&&!img.classList.contains('mse-decrypted')){
img.classList.add('decrypting');
decryptImageUltraFast(src,5).then(blobUrl=>{
if(blobUrl){
img.src=blobUrl;
img.classList.remove('decrypting');
img.classList.add('mse-decrypted');
const thumbnail=img.closest('.thumbnail');
if(thumbnail){
thumbnail.classList.add('loaded');
}
}
}).catch(error=>{
img.classList.remove('decrypting');
img.classList.add('decrypt-error');
});
}
observer.unobserve(img);
}
});
},{
root:null,
rootMargin:'100px',
threshold:0.1
});
document.querySelectorAll('img[data-needs-mse-decrypt]').forEach(img=>{
observer.observe(img);
});
return observer;
}
function setupMemoryManagement(){
setInterval(()=>{
const stats=smartCache.getStats();
const memoryUsagePercent=(stats.memoryUsage/stats.maxMemory)*100;
if(memoryUsagePercent>80){
for(let i=0;i<5;i++){
smartCache.evictLRU();
}
}
if(performance.memory){
const jsHeapUsed=performance.memory.usedJSHeapSize/(1024*1024);
if(jsHeapUsed>100){
}
}
},CONFIG.MEMORY_CLEANUP_INTERVAL);
}
function setupPerformanceMonitoring(){
let totalDecryptions=0;
let totalDecryptionTime=0;
let cacheHits=0;
const originalDecrypt=decryptImageUltraFast;
window.decryptImageUltraFast=async function(src,priority){
const startTime=Date.now();
const wasCached=smartCache.get(src)!==null;
const result=await originalDecrypt(src,priority);
if(wasCached){
cacheHits++;
}else{
totalDecryptions++;
totalDecryptionTime+=Date.now()-startTime;
}
return result;
};
window.getMSEStats=function(){
const engineStatus=hybridEngine.getStatus();
return{
totalDecryptions,
averageDecryptionTime:totalDecryptions>0 ? totalDecryptionTime/totalDecryptions:0,
cacheHitRate:(cacheHits/(cacheHits+totalDecryptions))*100,
cacheStats:smartCache.getStats(),
engineStatus:engineStatus,
workersAvailable:engineStatus.workersAvailable,
fallbackMode:engineStatus.fallbackMode
};
};
}
function setupImageProcessing(){
const checkExistingImages=()=>{
const needsDecrypt=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed])');
needsDecrypt.forEach(async(img)=>{
if(img.getAttribute('data-mse-fixed')==='true'||img.classList.contains('mse-decrypted')){
return;
}
const originalSrc=img.getAttribute('data-original-src');
await forceDecryptImage(img,originalSrc);
});
};
const forceDecryptImage=async(img,path)=>{
if(img.getAttribute('data-mse-fixed')==='true'||img.classList.contains('mse-decrypted')){
return;
}
if(!path||path.includes('null')||path==='null'){
console.warn('🚫 阻止fetch無效路徑:',path);
img.removeAttribute('data-needs-mse-decrypt');
img.removeAttribute('data-original-src');
img.setAttribute('data-mse-fixed','true');
return;
}
img.setAttribute('data-mse-processing','true');
try{
const response=await fetch(path);
if(!response.ok){
throw new Error(`HTTP ${response.status}:${response.statusText}`);
}
const arrayBuffer=await response.arrayBuffer();
const data=new Uint8Array(arrayBuffer);
const decrypted=new Uint8Array(data.length);
const offsetComplement=256-MSE_OFFSET;
for(let i=0;i<data.length;i++){
decrypted[i]=(data[i]+offsetComplement)& 255;
}
const blob=new Blob([decrypted],{type:'image/jpeg'});
const blobUrl=URL.createObjectURL(blob);
img.src=blobUrl;
img.removeAttribute('data-needs-mse-decrypt');
img.removeAttribute('data-mse-processing');
img.setAttribute('data-mse-fixed','true');
img.classList.add('mse-decrypted');
if(typeof cacheImage==='function'){
cacheImage(path,blobUrl);
}
}catch(error){
img.removeAttribute('data-mse-processing');
img.src=path;
}
};
const checkInterval=setInterval(()=>{
const hasUnprocessedImages=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed]):not([data-mse-processing])').length>0;
if(hasUnprocessedImages){
checkExistingImages();
}
},2000);
window.forceMSEFix=checkExistingImages;
setTimeout(checkExistingImages,1000);
}
function initializeUltraFastMSE(){
setupIntelligentImageObserver();
setupMemoryManagement();
setupPerformanceMonitoring();
setupImageProcessing();
window.decryptImageUltraFast=decryptImageUltraFast;
window.clearMSECache=()=>{
smartCache.cache.clear();
smartCache.blobUrls.clear();
smartCache.priorities.clear();
smartCache.accessTimes.clear();
smartCache.memoryUsage=0;
};
window.forcePredictiveLoad=()=>{
predictiveLoader.predictAndLoad();
};
window.addEventListener('beforeunload',()=>{
hybridEngine.destroy();
smartCache.cache.clear();
});
setTimeout(()=>{
predictiveLoader.predictAndLoad();
},500);
}
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',initializeUltraFastMSE);
}else{
initializeUltraFastMSE();
}
})();
(function(){
'use strict';
const MSE_OFFSET=37;
const GITHUB_BASE_URL='https://maso0310.github.io/memoir-developer-log/media/';
const CONFIG={
MAX_CONCURRENT_DECRYPT:8,
CACHE_SIZE:50,
PRELOAD_RANGE:3,
CHUNK_SIZE:64*1024,
PRIORITY_BOOST_MS:100,
MEMORY_CLEANUP_INTERVAL:30000,
INSTANT_LOAD_THRESHOLD:500,
};
class HybridDecryptionEngine{
constructor(){
this.workers=[];
this.workerCount=Math.min(4,navigator.hardwareConcurrency||2);
this.taskQueue=[];
this.busyWorkers=new Set();
this.workersAvailable=false;
this.fallbackMode=false;
this.initWorkers();
}
initWorkers(){
const workerCode=`
self.onmessage=function(e){
const{data,offset,taskId}=e.data;
try{
const result=new Uint8Array(data.length);
const offsetComplement=256-offset;
let i=0;
const len=data.length;
for(;i<len-3;i+=4){
result[i]=(data[i]+offsetComplement)& 255;
result[i+1]=(data[i+1]+offsetComplement)& 255;
result[i+2]=(data[i+2]+offsetComplement)& 255;
result[i+3]=(data[i+3]+offsetComplement)& 255;
}
for(;i<len;i++){
result[i]=(data[i]+offsetComplement)& 255;
}
self.postMessage({taskId,result,success:true});
}catch(error){
self.postMessage({taskId,error:error.message,success:false});
}
};
`;
try{
for(let i=0;i<this.workerCount;i++){
const blob=new Blob([workerCode],{type:'application/javascript'});
const worker=new Worker(URL.createObjectURL(blob));
worker.onmessage=(e)=>this.handleWorkerMessage(e,worker);
worker.onerror=(error)=>{
this.enableFallbackMode();
};
this.workers.push(worker);
}
if(this.workers.length>0){
this.workersAvailable=true;
}
}catch(error){
this.enableFallbackMode();
}
}
enableFallbackMode(){
this.fallbackMode=true;
this.workersAvailable=false;
this.workers.forEach(worker=>{
try{
worker.terminate();
}catch(e){
}
});
this.workers=[];
}
decryptOnMainThread(data){
const result=new Uint8Array(data.length);
const offsetComplement=256-MSE_OFFSET;
let i=0;
const len=data.length;
for(;i<len-3;i+=4){
result[i]=(data[i]+offsetComplement)& 255;
result[i+1]=(data[i+1]+offsetComplement)& 255;
result[i+2]=(data[i+2]+offsetComplement)& 255;
result[i+3]=(data[i+3]+offsetComplement)& 255;
}
for(;i<len;i++){
result[i]=(data[i]+offsetComplement)& 255;
}
return result;
}
async decrypt(data,taskId){
if(this.fallbackMode||!this.workersAvailable){
try{
const result=this.decryptOnMainThread(data);
return result;
}catch(error){
throw error;
}
}
return new Promise((resolve,reject)=>{
this.taskQueue.push({data,taskId,resolve,reject});
this.processQueue();
});
}
processQueue(){
if(this.fallbackMode||!this.workersAvailable){
while(this.taskQueue.length>0){
const task=this.taskQueue.shift();
try{
const result=this.decryptOnMainThread(task.data);
task.resolve(result);
}catch(error){
task.reject(error);
}
}
return;
}
while(this.taskQueue.length>0&&this.busyWorkers.size<this.workerCount){
const task=this.taskQueue.shift();
const worker=this.workers.find(w=>!this.busyWorkers.has(w));
if(worker){
this.busyWorkers.add(worker);
worker.currentTask=task;
worker.postMessage({
data:task.data,
offset:MSE_OFFSET,
taskId:task.taskId
});
}else{
this.taskQueue.unshift(task);
break;
}
}
}
handleWorkerMessage(e,worker){
const{taskId,result,success,error}=e.data;
const task=worker.currentTask;
this.busyWorkers.delete(worker);
worker.currentTask=null;
if(success){
task.resolve(result);
}else{
this.enableFallbackMode();
try{
const result=this.decryptOnMainThread(task.data);
task.resolve(result);
}catch(fallbackError){
task.reject(new Error(`Worker 和主線程解密都失敗:${error},${fallbackError.message}`));
}
}
this.processQueue();
}
destroy(){
this.workers.forEach(worker=>{
try{
worker.terminate();
}catch(e){
}
});
this.workers=[];
this.taskQueue=[];
this.busyWorkers.clear();
this.workersAvailable=false;
this.fallbackMode=false;
}
getStatus(){
return{
workersAvailable:this.workersAvailable,
fallbackMode:this.fallbackMode,
workerCount:this.workers.length,
queueLength:this.taskQueue.length,
busyWorkers:this.busyWorkers.size
};
}
}
class SmartDecryptCache{
constructor(){
this.cache=new Map();
this.priorities=new Map();
this.accessTimes=new Map();
this.blobUrls=new Map();
this.maxSize=CONFIG.CACHE_SIZE;
this.memoryUsage=0;
this.maxMemory=200*1024*1024;
}
set(key,data,priority=1){
if(this.cache.has(key)){
this.evict(key);
}
while(this.cache.size>=this.maxSize||this.memoryUsage>=this.maxMemory){
this.evictLRU();
}
const blob=new Blob([data]);
const blobUrl=URL.createObjectURL(blob);
this.cache.set(key,data);
this.blobUrls.set(key,blobUrl);
this.priorities.set(key,priority);
this.accessTimes.set(key,Date.now());
this.memoryUsage+=data.byteLength;
return blobUrl;
}
get(key){
if(this.cache.has(key)){
this.accessTimes.set(key,Date.now());
return this.blobUrls.get(key);
}
return null;
}
evict(key){
if(this.cache.has(key)){
const data=this.cache.get(key);
const blobUrl=this.blobUrls.get(key);
if(blobUrl){
URL.revokeObjectURL(blobUrl);
}
this.cache.delete(key);
this.blobUrls.delete(key);
this.priorities.delete(key);
this.accessTimes.delete(key);
this.memoryUsage-=data.byteLength;
}
}
evictLRU(){
let oldestKey=null;
let oldestTime=Date.now();
let lowestPriority=Infinity;
for(const[key,time]of this.accessTimes.entries()){
const priority=this.priorities.get(key)||1;
if(priority<lowestPriority||(priority===lowestPriority&&time<oldestTime)){
oldestTime=time;
oldestKey=key;
lowestPriority=priority;
}
}
if(oldestKey){
this.evict(oldestKey);
}
}
getStats(){
return{
size:this.cache.size,
maxSize:this.maxSize,
memoryUsage:this.memoryUsage,
maxMemory:this.maxMemory,
hitRate:this.hitRate||0
};
}
}
class PredictiveLoader{
constructor(){
this.viewportTracker=new Map();
this.scrollVelocity=0;
this.lastScrollTime=0;
this.lastScrollPosition=0;
this.loadQueue=[];
this.isProcessing=false;
this.setupScrollTracking();
}
setupScrollTracking(){
let scrollTimeout;
window.addEventListener('scroll',()=>{
const now=Date.now();
const currentPosition=window.scrollY;
if(this.lastScrollTime>0){
const timeDelta=now-this.lastScrollTime;
const positionDelta=currentPosition-this.lastScrollPosition;
this.scrollVelocity=Math.abs(positionDelta/timeDelta);
}
this.lastScrollTime=now;
this.lastScrollPosition=currentPosition;
clearTimeout(scrollTimeout);
scrollTimeout=setTimeout(()=>{
this.scrollVelocity=0;
this.predictAndLoad();
},150);
},{passive:true});
}
predictAndLoad(){
const images=document.querySelectorAll('img[data-needs-mse-decrypt]:not(.mse-decrypted)');
const predictions=[];
images.forEach(img=>{
const rect=img.getBoundingClientRect();
const distanceFromViewport=Math.max(0,rect.top-window.innerHeight);
const adjustedRange=CONFIG.PRELOAD_RANGE*(1+this.scrollVelocity*0.1);
const predictedViewTime=distanceFromViewport/(this.scrollVelocity*16+50);
if(predictedViewTime<adjustedRange*1000){
const priority=Math.max(1,5-Math.floor(predictedViewTime/200));
predictions.push({img,priority,predictedTime:predictedViewTime});
}
});
predictions
.sort((a,b)=>a.predictedTime-b.predictedTime)
.forEach(prediction=>{
this.queueLoad(prediction.img,prediction.priority);
});
}
queueLoad(img,priority){
const src=img.getAttribute('data-original-src')||img.src;
if(!src||this.loadQueue.some(item=>item.src===src)){
return;
}
this.loadQueue.push({img,src,priority,timestamp:Date.now()});
this.loadQueue.sort((a,b)=>b.priority-a.priority);
if(!this.isProcessing){
this.processQueue();
}
}
async processQueue(){
this.isProcessing=true;
while(this.loadQueue.length>0){
const concurrentTasks=[];
const maxConcurrent=Math.min(CONFIG.MAX_CONCURRENT_DECRYPT,this.loadQueue.length);
for(let i=0;i<maxConcurrent;i++){
const task=this.loadQueue.shift();
if(task){
concurrentTasks.push(this.processTask(task));
}
}
if(concurrentTasks.length>0){
await Promise.allSettled(concurrentTasks);
}
await new Promise(resolve=>setTimeout(resolve,1));
}
this.isProcessing=false;
}
async processTask(task){
const{img,src,priority}=task;
try{
const blobUrl=await decryptImageUltraFast(src,priority);
if(blobUrl&&img.parentNode){
img.src=blobUrl;
img.classList.add('mse-decrypted');
img.classList.remove('loading','decrypting');
const thumbnail=img.closest('.thumbnail');
if(thumbnail){
thumbnail.classList.add('loaded');
thumbnail.classList.remove('loading');
}
}
}catch(error){
img.classList.add('decrypt-error');
}
}
}
const hybridEngine=new HybridDecryptionEngine();
const smartCache=new SmartDecryptCache();
const predictiveLoader=new PredictiveLoader();
async function decryptImageUltraFast(src,priority=1){
const startTime=Date.now();
if(!src||src.includes('null')||src==='null'){
console.warn('🚫 阻止解密無效src路徑:',src);
throw new Error('Invalid src path:'+src);
}
const cached=smartCache.get(src);
if(cached){
return cached;
}
try{
const fetchOptions={
method:'GET',
cache:priority>3 ? 'force-cache':'default',
priority:priority>3 ? 'high':'auto'
};
const response=await fetch(src,fetchOptions);
if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}
const encryptedData=new Uint8Array(await response.arrayBuffer());
const taskId=`task_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
const decryptedData=await hybridEngine.decrypt(encryptedData,taskId);
const blobUrl=smartCache.set(src,decryptedData,priority);
const totalTime=Date.now()-startTime;
return blobUrl;
}catch(error){
throw error;
}
}
function setupIntelligentImageObserver(){
const observer=new IntersectionObserver((entries)=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
const img=entry.target;
const src=img.getAttribute('data-original-src')||img.src;
if(src&&!img.classList.contains('mse-decrypted')){
img.classList.add('decrypting');
decryptImageUltraFast(src,5).then(blobUrl=>{
if(blobUrl){
img.src=blobUrl;
img.classList.remove('decrypting');
img.classList.add('mse-decrypted');
const thumbnail=img.closest('.thumbnail');
if(thumbnail){
thumbnail.classList.add('loaded');
}
}
}).catch(error=>{
img.classList.remove('decrypting');
img.classList.add('decrypt-error');
});
}
observer.unobserve(img);
}
});
},{
root:null,
rootMargin:'100px',
threshold:0.1
});
document.querySelectorAll('img[data-needs-mse-decrypt]').forEach(img=>{
observer.observe(img);
});
return observer;
}
function setupMemoryManagement(){
setInterval(()=>{
const stats=smartCache.getStats();
const memoryUsagePercent=(stats.memoryUsage/stats.maxMemory)*100;
if(memoryUsagePercent>80){
for(let i=0;i<5;i++){
smartCache.evictLRU();
}
}
if(performance.memory){
const jsHeapUsed=performance.memory.usedJSHeapSize/(1024*1024);
if(jsHeapUsed>100){
}
}
},CONFIG.MEMORY_CLEANUP_INTERVAL);
}
function setupPerformanceMonitoring(){
let totalDecryptions=0;
let totalDecryptionTime=0;
let cacheHits=0;
const originalDecrypt=decryptImageUltraFast;
window.decryptImageUltraFast=async function(src,priority){
const startTime=Date.now();
const wasCached=smartCache.get(src)!==null;
const result=await originalDecrypt(src,priority);
if(wasCached){
cacheHits++;
}else{
totalDecryptions++;
totalDecryptionTime+=Date.now()-startTime;
}
return result;
};
window.getMSEStats=function(){
const engineStatus=hybridEngine.getStatus();
return{
totalDecryptions,
averageDecryptionTime:totalDecryptions>0 ? totalDecryptionTime/totalDecryptions:0,
cacheHitRate:(cacheHits/(cacheHits+totalDecryptions))*100,
cacheStats:smartCache.getStats(),
engineStatus:engineStatus,
workersAvailable:engineStatus.workersAvailable,
fallbackMode:engineStatus.fallbackMode
};
};
}
function setupImageProcessing(){
const checkExistingImages=()=>{
const needsDecrypt=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed])');
needsDecrypt.forEach(async(img)=>{
if(img.getAttribute('data-mse-fixed')==='true'||img.classList.contains('mse-decrypted')){
return;
}
const originalSrc=img.getAttribute('data-original-src');
await forceDecryptImage(img,originalSrc);
});
};
const forceDecryptImage=async(img,path)=>{
if(img.getAttribute('data-mse-fixed')==='true'||img.classList.contains('mse-decrypted')){
return;
}
if(!path||path.includes('null')||path==='null'){
console.warn('🚫 阻止fetch無效路徑:',path);
img.removeAttribute('data-needs-mse-decrypt');
img.removeAttribute('data-original-src');
img.setAttribute('data-mse-fixed','true');
return;
}
img.setAttribute('data-mse-processing','true');
try{
const response=await fetch(path);
if(!response.ok){
throw new Error(`HTTP ${response.status}:${response.statusText}`);
}
const arrayBuffer=await response.arrayBuffer();
const data=new Uint8Array(arrayBuffer);
const decrypted=new Uint8Array(data.length);
const offsetComplement=256-MSE_OFFSET;
for(let i=0;i<data.length;i++){
decrypted[i]=(data[i]+offsetComplement)& 255;
}
const blob=new Blob([decrypted],{type:'image/jpeg'});
const blobUrl=URL.createObjectURL(blob);
img.src=blobUrl;
img.removeAttribute('data-needs-mse-decrypt');
img.removeAttribute('data-mse-processing');
img.setAttribute('data-mse-fixed','true');
img.classList.add('mse-decrypted');
if(typeof cacheImage==='function'){
cacheImage(path,blobUrl);
}
}catch(error){
img.removeAttribute('data-mse-processing');
img.src=path;
}
};
const checkInterval=setInterval(()=>{
const hasUnprocessedImages=document.querySelectorAll('img[data-needs-mse-decrypt="true"]:not([data-mse-fixed]):not([data-mse-processing])').length>0;
if(hasUnprocessedImages){
checkExistingImages();
}
},2000);
window.forceMSEFix=checkExistingImages;
setTimeout(checkExistingImages,1000);
}
function initializeUltraFastMSE(){
setupIntelligentImageObserver();
setupMemoryManagement();
setupPerformanceMonitoring();
setupImageProcessing();
window.decryptImageUltraFast=decryptImageUltraFast;
window.clearMSECache=()=>{
smartCache.cache.clear();
smartCache.blobUrls.clear();
smartCache.priorities.clear();
smartCache.accessTimes.clear();
smartCache.memoryUsage=0;
};
window.forcePredictiveLoad=()=>{
predictiveLoader.predictAndLoad();
};
window.addEventListener('beforeunload',()=>{
hybridEngine.destroy();
smartCache.cache.clear();
});
setTimeout(()=>{
predictiveLoader.predictAndLoad();
},500);
}
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',initializeUltraFastMSE);
}else{
initializeUltraFastMSE();
}
})();