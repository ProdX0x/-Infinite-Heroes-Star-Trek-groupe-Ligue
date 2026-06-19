
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import { DEFAULT_STORY_PAGES, LENGTH_OPTIONS, INITIAL_PAGES, BATCH_SIZE, DECISION_PAGES, GENRES, TONES, LANGUAGES, ComicFace, Beat, Persona, GATE_PAGE, MURAL_MODE_VALUE, BudgetStats } from './types';
import { Setup } from './Setup';
import { Book } from './Book';
import { useApiKey } from './useApiKey';
import { ApiKeyDialog } from './ApiKeyDialog';
import { BudgetTracker } from './BudgetTracker';

// --- Constants ---
const MODEL_V3 = "gemini-3-pro-image-preview";
const MODEL_IMAGE_GEN_NAME = MODEL_V3;
const MODEL_TEXT_NAME = MODEL_V3;

// --- Components ---

const PersistentFooter: React.FC<{ 
    onDownloadPDF: () => void;
    onDownloadVideo: () => void;
    isExporting: boolean; 
}> = ({ onDownloadPDF, onDownloadVideo, isExporting }) => (
    <div className="fixed bottom-0 inset-x-0 z-[100] bg-black border-t-4 border-yellow-400 p-2 md:p-3 flex justify-between items-center shadow-[0_-5px_15px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
        <div className="hidden md:flex flex-col items-start pl-2">
             <span className="font-comic text-white text-lg tracking-wide uppercase">My Collection</span>
             <span className="text-xs text-gray-500 font-mono uppercase">Save your progress</span>
        </div>
        
        <div className="flex gap-3 mx-auto md:absolute md:left-1/2 md:-translate-x-1/2">
             <button onClick={onDownloadPDF} className="comic-btn bg-white text-black px-4 py-2 text-sm md:text-base hover:bg-gray-200 flex items-center gap-2 font-bold uppercase transition-transform active:scale-95" title="Download Comic as PDF">
                 <span>📄</span> <span className="hidden sm:inline">Save PDF</span>
             </button>
             <button onClick={onDownloadVideo} disabled={isExporting} className="comic-btn bg-blue-600 text-white px-4 py-2 text-sm md:text-base hover:bg-blue-500 disabled:bg-gray-600 flex items-center gap-2 font-bold uppercase transition-transform active:scale-95" title="Create Video Slideshow">
                 <span>{isExporting ? '⏳' : '🎥'}</span> <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Save Video'}</span>
             </button>
        </div>

        <div className="hidden md:flex flex-col items-end pr-2 font-comic text-white">
            <span className="text-yellow-400">Powered by Gemini</span>
            <a href="https://x.com/ammaar" target="_blank" rel="noopener noreferrer" className="text-gray-500 text-xs hover:text-white transition-colors">@Steve</a>
        </div>
    </div>
);

const BUDGET_LOCAL_STORAGE_KEY = "gemini_comic_budget_stats";

const getInitialBudgetStats = (): BudgetStats => {
  try {
    const saved = localStorage.getItem(BUDGET_LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        inputTokens: Number(parsed.inputTokens) || 0,
        outputTokens: Number(parsed.outputTokens) || 0,
        imagesCount: Number(parsed.imagesCount) || 0,
        textRequestsCount: Number(parsed.textRequestsCount) || 0,
      };
    }
  } catch (e) {
    console.error("Failed to load budget stats:", e);
  }
  return {
    inputTokens: 0,
    outputTokens: 0,
    imagesCount: 0,
    textRequestsCount: 0,
  };
};

const App: React.FC = () => {
  const { validateApiKey, setShowApiKeyDialog, showApiKeyDialog, handleApiKeyDialogContinue } = useApiKey();

  // API Budget States
  const [budgetStats, setBudgetStats] = useState<BudgetStats>(getInitialBudgetStats);

  const updateBudgetStats = (inputTokens: number, outputTokens: number, imagesCount: number, textRequestsCount: number) => {
    setBudgetStats(prev => {
      const next = {
        inputTokens: prev.inputTokens + inputTokens,
        outputTokens: prev.outputTokens + outputTokens,
        imagesCount: prev.imagesCount + imagesCount,
        textRequestsCount: prev.textRequestsCount + textRequestsCount,
      };
      localStorage.setItem(BUDGET_LOCAL_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetBudgetStats = () => {
    const cleared = { inputTokens: 0, outputTokens: 0, imagesCount: 0, textRequestsCount: 0 };
    localStorage.setItem(BUDGET_LOCAL_STORAGE_KEY, JSON.stringify(cleared));
    setBudgetStats(cleared);
  };

  // Character States
  const [hero, setHeroState] = useState<Persona | null>(null);
  const [friend, setFriendState] = useState<Persona | null>(null);
  const [rival, setRivalState] = useState<Persona | null>(null);
  const [muralRef, setMuralRef] = useState<Persona | null>(null); // For group upload
  const [muralCharCount, setMuralCharCount] = useState(3);
  
  const [heroName, setHeroName] = useState("Hero");
  const [friendName, setFriendName] = useState("Partner");
  const [rivalName, setRivalName] = useState("Villain");

  const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);
  const [storyLength, setStoryLength] = useState(DEFAULT_STORY_PAGES); 
  const [customPremise, setCustomPremise] = useState("");
  const [storyTone, setStoryTone] = useState(TONES[0]);
  const [richMode, setRichMode] = useState(true);
  
  const heroRef = useRef<Persona | null>(null);
  const friendRef = useRef<Persona | null>(null);
  const rivalRef = useRef<Persona | null>(null);
  const muralImageRef = useRef<Persona | null>(null);

  const setHero = (p: Persona | null) => { setHeroState(p); heroRef.current = p; };
  const setFriend = (p: Persona | null) => { setFriendState(p); friendRef.current = p; };
  const setRival = (p: Persona | null) => { setRivalState(p); rivalRef.current = p; };
  const setMuralImage = (p: Persona | null) => { setMuralRef(p); muralImageRef.current = p; };
  
  const [comicFaces, setComicFaces] = useState<ComicFace[]>([]);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [showSetup, setShowSetup] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generatingPages = useRef(new Set<number>());
  const historyRef = useRef<ComicFace[]>([]);

  // Story dimensions adaptation
  const isMuralMode = storyLength === MURAL_MODE_VALUE;
  
  useEffect(() => {
    // Dynamically update the document variables for book size if needed
    const root = document.documentElement;
    if (isStarted && isMuralMode) {
      root.style.setProperty('--page-height', 'min(60vh, 500px)');
      root.style.setProperty('--page-width', 'calc(var(--page-height) * 1.777)');
    } else {
      root.style.setProperty('--page-height', 'min(80vh, 750px)');
      root.style.setProperty('--page-width', 'calc(var(--page-height) * 0.666)');
    }
  }, [isStarted, isMuralMode]);

  const totalPages = isMuralMode ? 0 : storyLength + 1;
  const effectiveGatePage = (storyLength === 0 || isMuralMode) ? 0 : Math.min(GATE_PAGE, totalPages);
  
  const isReadyToRead = !!comicFaces.find(f => f.pageIndex === effectiveGatePage)?.imageUrl;
  
  const progressCount = comicFaces.filter(f => f.imageUrl && f.pageIndex !== undefined && f.pageIndex <= effectiveGatePage).length;
  const progressTotal = effectiveGatePage + 1;
  const gateProgress = (storyLength === 0 || isMuralMode) && !isReadyToRead ? "INKING COVER..." : `PRINTING... ${progressCount}/${progressTotal}`;

  const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleAPIError = (e: any) => {
    const msg = String(e);
    if (msg.includes('Requested entity was not found') || msg.includes('API_KEY_INVALID') || msg.toLowerCase().includes('permission denied')) {
      setShowApiKeyDialog(true);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const generateBeat = async (history: ComicFace[], isRightPage: boolean, pageNum: number, isDecisionPage: boolean, maxPages: number): Promise<Beat> => {
    const langName = LANGUAGES.find(l => l.code === selectedLanguage)?.name || "English";
    const hName = heroName.trim() || "Hero";
    const fName = friendName.trim() || "Partner";
    const rName = rivalName.trim() || "Villain";

    let genreModifier = "";
    if (selectedGenre === "USS Enterprise Bridge (Star Trek)") {
        genreModifier = "SETTING: The scrupulous and iconic bridge of the USS Enterprise (Star Trek). Atmosphere is professional, naval-sci-fi, with glowing consoles and a massive viewscreen showing stars. Characters should use Starfleet-like dialogue.";
    }

    const prompt = `
You are writing a comic book script. PAGE ${pageNum} of ${maxPages}.
TARGET LANGUAGE: ${langName}. GENRE: ${selectedGenre}.
${genreModifier}
CHARACTERS: Hero: "${hName}", Friend: "${fName}", Rival: "${rName}".
OUTPUT STRICT JSON:
{
  "caption": "Text in ${langName} (max 30 words).",
  "dialogue": "Speech in ${langName} (max 20 words).",
  "scene": "Visual description in English. MUST mention the background setting: ${selectedGenre}.",
  "focus_char": "hero" OR "friend" OR "rival" OR "other",
  "choices": ["A", "B"] (If decision page)
}
`;
    try {
        const ai = getAI();
        const res = await ai.models.generateContent({ model: MODEL_TEXT_NAME, contents: prompt, config: { responseMimeType: 'application/json' } });
        let rawText = res.text || "{}";
        const inputTokens = res.usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4);
        const outputTokens = res.usageMetadata?.candidatesTokenCount || Math.ceil(rawText.length / 4);
        updateBudgetStats(inputTokens, outputTokens, 0, 1);
        return JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim()) as Beat;
    } catch (e) { handleAPIError(e); return { caption: "...", scene: `Scene ${pageNum}`, focus_char: 'hero', choices: [] }; }
  };

  const generateImage = async (beat: Beat, type: ComicFace['type']): Promise<string> => {
    const hName = heroName.trim() || "Hero";
    const fName = friendName.trim() || "Partner";
    const rName = rivalName.trim() || "Villain";
    const contents: any[] = [];

    const isStarTrek = selectedGenre === "USS Enterprise Bridge (Star Trek)";
    const backgroundStyle = isStarTrek ? "scrupulously detailed bridge of the USS Enterprise (Star Trek style) with accurate LCARS consoles and captain's chair" : `${selectedGenre} setting`;

    if (type === 'mural' && muralImageRef.current) {
        contents.push({ text: `REFERENCE PHOTO (Use this to identify EXACTLY ${muralCharCount} distinct people and their facial features):` });
        contents.push({ inlineData: { mimeType: 'image/jpeg', data: muralImageRef.current.base64 } });
        
        let promptText = `STYLE: Vibrant Colored Comic Book Art, sharp ink lines, high detail. ASPECT RATIO: 16:9 Wide-angle. `;
        
        if (isStarTrek) {
          promptText += `TASK: Create a scrupulous and majestic panoramic crew portrait on the USS Enterprise Bridge. `;
          promptText += `STRICT COUNT VALIDATION: There MUST be EXACTLY ${muralCharCount} UNIQUE characters present in the scene. Each must be a distinct individual based on a different person from the reference photo. `;
          promptText += `NO DUPLICATES: It is forbidden to repeat the same character face. Each of the ${muralCharCount} characters must look like a different unique individual from the uploaded group photo. `;
          promptText += `FACIAL FIDELITY: Maintain the highest possible resemblance between the ${muralCharCount} generated characters and the faces provided in the resource photo. They must be instantly recognizable. `;
          promptText += `OBLIGATORY UNIFORMS: Every single character MUST wear a precise Star Trek Starfleet uniform (Command Yellow, Science Blue, or Operations Red) with delta badges and rank insignia. No exceptions. `;
          promptText += `ANATOMY & STAGING: Use realistic, coherent human anatomy. Characters are placed at their command stations: Captain's chair, helm, navigation, and science consoles. `;
          promptText += `GAZE: Every character MUST face forward and look directly into the camera (at the viewer), making them clearly identifiable. `;
          promptText += `BRIDGE DETAIL: The bridge must be a faithful and scrupulous reproduction of the USS Enterprise bridge with glowing LCARS panels. `;
          promptText += `TEXT: Center the title "INFINITE HEROES" at the bottom in a bold comic font.`;
        } else {
          promptText += `TASK: Panoramic epic poster featuring EXACTLY ${muralCharCount} unique characters from the reference photo standing together ${backgroundStyle}. NO DUPLICATES. All facing the camera. High detail comic style. Title: "INFINITE HEROES".`;
        }
        
        contents.push({ text: promptText });
    } else {
        if (heroRef.current) contents.push({ inlineData: { mimeType: 'image/jpeg', data: heroRef.current.base64 } });
        let promptText = `STYLE: ${selectedGenre} comic art. `;
        if (type === 'cover') {
            promptText += `Comic Cover 2:3. Hero: "${hName}" ${backgroundStyle}. Character looking at camera. Title: "INFINITE HEROES". Include names: ${hName}, ${fName}, ${rName} in artistic comic font.`;
        } else {
            promptText += `Scene: ${beat.scene}. Background: ${backgroundStyle}. Caption: "${beat.caption}". Character faces the camera.`;
        }
        contents.push({ text: promptText });
    }

    try {
        const ai = getAI();
        const res = await ai.models.generateContent({
          model: MODEL_IMAGE_GEN_NAME,
          contents: contents,
          config: { imageConfig: { aspectRatio: type === 'mural' ? '16:9' : '2:3' } }
        });
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
            updateBudgetStats(0, 0, 1, 0);
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        return '';
    } catch (e) { handleAPIError(e); return ''; }
  };

  const updateFaceState = (id: string, updates: Partial<ComicFace>) => {
      setComicFaces(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const generateSinglePage = async (faceId: string, pageNum: number, type: ComicFace['type']) => {
      let beat: Beat = { scene: "", choices: [], focus_char: 'other' };
      if (type === 'story') beat = await generateBeat([], pageNum % 2 === 0, pageNum, false, storyLength);
      
      updateFaceState(faceId, { narrative: beat, choices: beat.choices });
      const url = await generateImage(beat, type);
      updateFaceState(faceId, { imageUrl: url, isLoading: false });
  };

  const generateAllPages = async (storyLen: number) => {
      await generateSinglePage('cover', 0, 'cover');
      
      // Generate page 1 and page 2 first (allows fast access to read action)
      await Promise.all([
          generateSinglePage('page_1', 1, 'story'),
          generateSinglePage('page_2', 2, 'story')
      ]);

      // Then trigger all remaining pages and back cover in the background
      for (let i = 3; i <= storyLen; i++) {
          generateSinglePage(`page_${i}`, i, 'story');
      }
      generateSinglePage('back_cover', storyLen + 1, 'back_cover');
  };

  const launchStory = async () => {
    const hasKey = await validateApiKey();
    if (!hasKey) return;
    
    if (isMuralMode && !muralImageRef.current) { alert("Veuillez uploader la photo de groupe !"); return; }
    if (!isMuralMode && !heroRef.current) { alert("Veuillez uploader votre héros !"); return; }

    setIsTransitioning(true);
    setComicFaces([]);

    setTimeout(async () => {
        setIsStarted(true);
        setShowSetup(false);
        setIsTransitioning(false);

        if (isMuralMode) {
            const muralFace: ComicFace = { id: 'mural', type: 'mural', choices: [], isLoading: true, pageIndex: 0 };
            setComicFaces([muralFace]);
            await generateSinglePage('mural', 0, 'mural');
        } else {
            const initialFaces: ComicFace[] = [];
            initialFaces.push({ id: 'cover', type: 'cover', choices: [], isLoading: true, pageIndex: 0 });
            for (let i = 1; i <= storyLength; i++) {
                initialFaces.push({ id: `page_${i}`, type: 'story', choices: [], isLoading: true, pageIndex: i });
            }
            initialFaces.push({ id: 'back_cover', type: 'back_cover', choices: [], isLoading: true, pageIndex: storyLength + 1 });
            
            setComicFaces(initialFaces);
            generateAllPages(storyLength);
        }
    }, 1100);
  };

  const resetApp = () => {
      setIsStarted(false);
      setShowSetup(true);
      setComicFaces([]);
      setCurrentSheetIndex(0);
      setHero(null);
      setMuralImage(null);
  };

  const downloadPDF = () => {
    const isL = isMuralMode;
    const doc = new jsPDF({ orientation: isL ? 'landscape' : 'portrait', unit: 'pt', format: isL ? [720, 480] : [480, 720] });
    const pagesToPrint = comicFaces.filter(f => f.imageUrl).sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0));
    pagesToPrint.forEach((face, index) => {
        if (index > 0) doc.addPage(isL ? [720, 480] : [480, 720], isL ? 'landscape' : 'portrait');
        if (face.imageUrl) doc.addImage(face.imageUrl, 'JPEG', 0, 0, isL ? 720 : 480, isL ? 480 : 720);
    });
    doc.save('Infinite-Heroes-Creation.pdf');
  };

  return (
    <div className="comic-scene" style={{ paddingBottom: isStarted ? '80px' : '0' }}>
      {showApiKeyDialog && <ApiKeyDialog onContinue={handleApiKeyDialogContinue} />}
      
      <Setup 
          show={showSetup}
          isTransitioning={isTransitioning}
          hero={hero}
          friend={friend}
          rival={rival}
          muralRef={muralRef}
          muralCharCount={muralCharCount}
          heroName={heroName}
          friendName={friendName}
          rivalName={rivalName}
          selectedGenre={selectedGenre}
          selectedLanguage={selectedLanguage}
          storyLength={storyLength}
          customPremise={customPremise}
          richMode={richMode}
          onHeroUpload={async (f) => setHero({ base64: await fileToBase64(f), desc: "Hero" })}
          onFriendUpload={async (f) => setFriend({ base64: await fileToBase64(f), desc: "Friend" })}
          onRivalUpload={async (f) => setRival({ base64: await fileToBase64(f), desc: "Rival" })}
          onMuralUpload={async (f) => setMuralImage({ base64: await fileToBase64(f), desc: "Group" })}
          onMuralCharCountChange={setMuralCharCount}
          onHeroNameChange={setHeroName}
          onFriendNameChange={setFriendName}
          onRivalNameChange={setRivalName}
          onGenreChange={setSelectedGenre}
          onLanguageChange={setSelectedLanguage}
          onStoryLengthChange={setStoryLength}
          onPremiseChange={setCustomPremise}
          onRichModeChange={setRichMode}
          onLaunch={launchStory}
      />
      
      <Book 
          comicFaces={comicFaces}
          totalPages={totalPages}
          currentSheetIndex={currentSheetIndex}
          isStarted={isStarted}
          isSetupVisible={showSetup && !isTransitioning}
          isExporting={isExporting}
          isReadyToRead={isReadyToRead}
          gateProgress={gateProgress}
          onSheetClick={(idx) => setCurrentSheetIndex(idx)}
          onChoice={() => {}}
          onOpenBook={() => setCurrentSheetIndex(1)}
          onDownloadPDF={downloadPDF}
          onDownloadVideo={() => {}}
          onReset={resetApp}
      />

      {isStarted && <PersistentFooter onDownloadPDF={downloadPDF} onDownloadVideo={() => {}} isExporting={isExporting} />}
      
      {/* Floating Retro Comic Budget & Cost Tracker */}
      <BudgetTracker stats={budgetStats} onReset={resetBudgetStats} />
    </div>
  );
};

export default App;
