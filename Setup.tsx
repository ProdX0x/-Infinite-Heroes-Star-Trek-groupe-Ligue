
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { GENRES, LANGUAGES, LENGTH_OPTIONS, Persona, MURAL_MODE_VALUE } from './types';

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    rival: Persona | null;
    muralRef: Persona | null;
    muralCharCount: number;
    heroName: string;
    friendName: string;
    rivalName: string;
    selectedGenre: string;
    selectedLanguage: string;
    storyLength: number;
    customPremise: string;
    richMode: boolean;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onRivalUpload: (file: File) => void;
    onMuralUpload: (file: File) => void;
    onMuralCharCountChange: (val: number) => void;
    onHeroNameChange: (val: string) => void;
    onFriendNameChange: (val: string) => void;
    onRivalNameChange: (val: string) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onStoryLengthChange: (val: number) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onLaunch: () => void;
}

export const Setup: React.FC<SetupProps> = (props) => {
    if (!props.show && !props.isTransitioning) return null;

    const isMural = props.storyLength === MURAL_MODE_VALUE;

    return (
        <div className={`fixed inset-0 z-[200] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4`}
             style={{ animation: props.isTransitioning ? 'knockout-exit 1s forwards' : 'none' }}>
          <div className="max-w-[950px] w-full bg-white p-6 rotate-1 border-[6px] border-black shadow-[12px_12px_0px_rgba(0,0,0,0.6)] relative">
                
                <div className="text-center mb-6">
                    <h1 className="font-comic text-6xl text-red-600 leading-none inline-block mr-3" style={{textShadow: '3px 3px 0px black'}}>INFINITE</h1>
                    <h1 className="font-comic text-6xl text-yellow-400 leading-none inline-block" style={{textShadow: '3px 3px 0px black'}}>HEROES</h1>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 mb-6 text-left">
                    
                    {/* 1. LE CASTING */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="font-comic text-2xl bg-black text-white px-3 py-1 w-fit transform -rotate-2">1. LE CASTING</div>
                        
                        {!isMural ? (
                            <div className="flex flex-col gap-3">
                                {/* Hero */}
                                <div className={`p-3 border-4 border-dashed ${props.hero ? 'border-green-500' : 'border-blue-400'}`}>
                                    <input value={props.heroName} onChange={(e) => props.onHeroNameChange(e.target.value)} placeholder="NOM DU HÉROS" className="font-comic text-xl w-full mb-2 border-b-2 border-black outline-none bg-transparent" />
                                    <label className="comic-btn bg-blue-500 text-white p-2 block text-center cursor-pointer">
                                        {props.hero ? '✓ HÉROS PRÊT' : 'PHOTO DU HÉROS'}
                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && props.onHeroUpload(e.target.files[0])} />
                                    </label>
                                </div>
                                {/* Partenaire & Rival (simplifiés pour l'espace) */}
                                <div className="grid grid-cols-2 gap-2">
                                     <label className="comic-btn bg-purple-500 text-white p-2 text-center text-xs cursor-pointer">
                                        {props.friend ? '✓ PARTENAIRE' : 'PARTENAIRE'}
                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && props.onFriendUpload(e.target.files[0])} />
                                     </label>
                                     <label className="comic-btn bg-red-600 text-white p-2 text-center text-xs cursor-pointer">
                                        {props.rival ? '✓ RIVAL' : 'RIVAL'}
                                        <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && props.onRivalUpload(e.target.files[0])} />
                                     </label>
                                </div>
                            </div>
                        ) : (
                            <div className={`p-5 border-4 border-dashed border-yellow-500 bg-yellow-50 h-full flex flex-col justify-center items-center text-center`}>
                                <div className="font-comic text-3xl text-black mb-4 uppercase">Photo de Groupe</div>
                                <p className="font-comic text-sm text-gray-600 mb-4">Uploadez une image avec tous vos personnages</p>
                                <label className="comic-btn bg-yellow-400 text-black px-8 py-4 text-2xl cursor-pointer hover:bg-yellow-300">
                                    {props.muralRef ? '✓ PHOTO CHARGÉE' : 'SÉLECTIONNER'}
                                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && props.onMuralUpload(e.target.files[0])} />
                                </label>
                            </div>
                        )}
                    </div>

                    {/* 2. L'HISTOIRE */}
                    <div className="flex-1 flex flex-col gap-4">
                        <div className="font-comic text-2xl bg-black text-white px-3 py-1 w-fit transform rotate-2">2. L'HISTOIRE</div>
                        
                        <div className="bg-[#fff952] p-4 border-[4px] border-black shadow-[8px_8px_0px_black] h-full">
                            <p className="font-comic text-lg font-bold mb-2 uppercase">Format & Longueur</p>
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <button onClick={() => props.onStoryLengthChange(MURAL_MODE_VALUE)} className={`comic-btn p-2 text-sm ${isMural ? 'bg-[#ff0055] text-white' : 'bg-white text-black'}`}>
                                    MURALE (16:9)
                                </button>
                                <button onClick={() => props.onStoryLengthChange(0)} className={`comic-btn p-2 text-sm ${props.storyLength === 0 ? 'bg-[#ff0055] text-white' : 'bg-white text-black'}`}>
                                    COUVERTURE
                                </button>
                                {LENGTH_OPTIONS.map(len => (
                                    <button key={len} onClick={() => props.onStoryLengthChange(len)} className={`comic-btn p-2 text-sm ${props.storyLength === len ? 'bg-[#ff0055] text-white' : 'bg-white text-black'}`}>
                                        {len} PAGES
                                    </button>
                                ))}
                            </div>

                            {isMural && (
                                <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <p className="font-comic text-lg font-bold mb-1 uppercase">Nombre de personnages</p>
                                    <div className="flex items-center gap-4 bg-white p-2 border-2 border-black">
                                        <input type="range" min="2" max="15" value={props.muralCharCount} onChange={(e) => props.onMuralCharCountChange(parseInt(e.target.value))} className="flex-1 accent-red-600 cursor-pointer" />
                                        <span className="font-comic text-2xl bg-red-600 text-white px-3 py-1 min-w-[3rem] text-center">{props.muralCharCount}</span>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-3">
                                <select value={props.selectedGenre} onChange={(e) => props.onGenreChange(e.target.value)} className="w-full font-comic text-lg p-2 border-2 border-black bg-white uppercase shadow-[3px_3px_0px_black]">
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                                <select value={props.selectedLanguage} onChange={(e) => props.onLanguageChange(e.target.value)} className="w-full font-comic text-lg p-2 border-2 border-black bg-white uppercase shadow-[3px_3px_0px_black]">
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <button onClick={props.onLaunch} className="comic-btn bg-red-600 text-white text-4xl py-5 w-full hover:bg-red-500 shadow-[8px_8px_0px_black] hover:shadow-[10px_10px_0px_black]">
                    LANCER L'AVENTURE !
                </button>
            </div>
        </div>
    );
}
