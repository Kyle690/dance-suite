'use client';
import React, { useState } from 'react';
import ScrutineerSignIn from "@/app/(pages)/scrutineer/auth/_components/ScrutineerSignIn";
import ScrutineerSignup from "@/app/(pages)/scrutineer/auth/_components/ScrutineerSignup";

type pageType = {};
const Page: React.FC<pageType> = () => {

    const [ mode, setMode ]=useState('signin')

    return mode==="signin"?
        <ScrutineerSignIn onModeChange={()=>setMode("signup")}/>:
        <ScrutineerSignup onModeChange={()=>setMode("signin")}/>
};

export default Page;
