
import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { SignInButton } from "@clerk/nextjs";
import { SignIn } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Loading, LoadingPage } from "~/Components/Loading";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import ErrorPage from "~/Components/ErrorPage";
import { PageLayout } from "~/Components/Layout";

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

    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0]);
        setInput("");
      } else {
        toast.error("Opps... only emojis are allowed 🤌");
      }
    },
  });

  // const { mutate } = api.posts.create.useMutation();

  console.log(user);

  if (!user) return null;

  return (
    <div className="sticky top-0 flex border-b p-6 w-full gap-4 bg-black">
      <Image
        src={user.imageUrl}
        width={26}
        height={26}
        alt="Profile image"
        className="h-14 w-14 rounded-full"
      />
      <input
        placeholder="Type some emojis !..."
        className="w-[50%] grow bg-transparent outline-none"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })} disabled={isPosting}>
          Post
        </button>
      )}

      {isPosting && (
        <div className="item-center flex justify-center">
          <Loading size={20} />{" "}
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;

  return (
    <div key={post.id} className="flex gap-4 border-b border-slate-400 p-8">
      <Image
        src={author?.profileImage}
        className="h-14 w-14 rounded-full "
        width={26}
        height={26}
        alt="Profile pic"
      />
      <div className="flex flex-col">
        <div className="flex font-bold">
          <Link href={`/@${author.firstName}`}>
            <span>{`@${author.firstName}`}</span>
          </Link>

          <Link href={`/post/${post.id}`}>
            <span className="font-thin">{` . ${dayjs(
              post.createdAt,
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;

  if (!data)
    return (
      <div>
        <ErrorPage />
      </div>
    );

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
    <PageLayout>
      <div className="sticky top-0 w-full border-x border-slate-400 md:max-h-full  md:max-w-2xl md:overflow-scroll">
        {!isSignedIn && (
          <div className="flex justify-center border-b bg-white ">
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
        <Feed />
      </div>
    </PageLayout>
  );
}
