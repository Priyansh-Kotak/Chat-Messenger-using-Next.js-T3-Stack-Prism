import Head from "next/head";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { LoadingPage } from "~/Components/Loading";

dayjs.extend(relativeTime);

const CreateWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState<string>(""); // Use array destructuring for useState
  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
  });

  // const { mutate } = api.posts.create.useMutation();

  console.log(user);

  if (!user) return null;

  return (
    <div className="flex w-full gap-6">
      <img
        src={user.imageUrl}
        alt="Profile image"
        className="h-14 w-14 rounded-full"
      />
      <input
        placeholder="Type some emojis !..."
        className="w-[50%] grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
      />
      <button onClick={() => mutate({ content: input })}>Post</button>
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-4 border-b border-slate-400 p-8">
      <img src={author?.profileImage} className="h-14 w-14 rounded-full " />
      <div className="flex flex-col">
        <div className="flex font-bold">
          <span>{`@${author.username}`}</span>
          <span className="font-thin">{` . ${dayjs(
            post.createdAt,
          ).fromNow()}`}</span>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const [showSignIn, setShowSignIn] = useState(false);

  const toggleSignIn = () => {
    setShowSignIn(!showSignIn);
  };

  api.posts.getAll.useQuery();

  if (!userLoaded) return <div></div>;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl ">
          <div className="flex w-full  border-b border-slate-400 p-4">
            {!isSignedIn && (
              <div className="flex justify-center ">
                <SignInButton>
                  <button className="text-white" onClick={toggleSignIn}>
                    Sign in
                  </button>
                </SignInButton>
                {showSignIn && <SignIn />}
              </div>
            )}
            {isSignedIn && (
              <div>
                <SignOutButton>
                  <button className="text-white">Sign out</button>
                </SignOutButton>
              </div>
            )}

            <CreateWizard />
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
}
