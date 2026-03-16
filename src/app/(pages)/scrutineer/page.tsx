import React from 'react';
import { redirect } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";

type pageType = {};
const Page: React.FC<pageType> = async() => {

    const supabase = await createClient();
    const user = await supabase.auth.getUser()

    console.log('user scrutineer', user);

    redirect(user?"/scrutineer/profile":"scrutineer/auth");


};

export default Page;
