import { GetServerSideProps } from "next"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"

import Topic from "@/features/project/Topic"
import { iProject } from "@/utils/scraper"
import { Octokit as Github } from "@octokit/core"

type Props = {
	project: iProject & { readme: string | null; monorepo: string[] | null }
}

const topics: [string, string, string][] = [
	["special", "⭐", "This is a special repository!"],
	["hackathon", "🧑‍💻", "This project was a hackathon project and most likely won't be updated"],
	["unfinished", "🚧", "This project has yet to be completed..."],
	["deprecated", "⚠️", "This project is not getting any further updates!"],
	["broken", "💥", "This project does not work!"]
]

const Project = ({ project }: Props) => {
	return (
		<main className="container mx-auto xs:px-4 sm:px-6 xs:py-8 sm:py-12 lg:py-16">
			<Link
				href="/projects"
				className="inline-block hover:scale-105 font-montserrat-regular xs:text-sm sm:text-base lg:text-md">
				&larr; Projects
			</Link>
			<h1 className="xs:mt-4 sm:mt-6 lg:mt-8 xs:text-3xl sm:text-4xl lg:text-5xl w-fit font-montserrat-bold">
				{project.name}
				<span className="align-middle xs:text-xl sm:text-2xl lg:text-3xl">
					{topics
						.filter(t => project.topics.includes(t[0]))
						.map(([topic, emoji, message]) => (
							<span
								key={topic}
								title={message}
								className="inline-block cursor-default ms-2 hover:scale-125">
								{emoji}
							</span>
						))}
				</span>
			</h1>
			{project.monorepo ? (
				<div className="flex flex-wrap gap-2 mt-2 font-montserrat-regular">
					{project.monorepo.map(r => (
						<p
							key={r}
							className="px-2 py-1 xs:text-xs sm:text-sm lg:text-md bg-slate-100">
							{r}
						</p>
					))}
				</div>
			) : null}
			<p className="xs:mt-4 sm:mt-6 lg:mt-8 xs:text-sm sm:text-base lg:text-md font-montserrat-regular">
				{project.description}
			</p>
			<div className="flex flex-wrap gap-3 xs:gap-1 sm:gap-2 xs:mt-2 sm:mt-3 lg:mt-4">
				{project.topics.map(t => (
					<Topic
						key={t}
						topic={t}
					/>
				))}
			</div>

			<Link
				href={`https://github.com/zS1L3NT/` + project.name}
				className="flex items-center gap-2 xs:mt-6 sm:mt-8 lg:mt-10 hover:scale-105 w-fit">
				<Image
					src={`https://res.cloudinary.com/zs1l3nt/image/upload/icons/github.svg`}
					alt={"Github icon"}
					width={30}
					height={30}
				/>
				<h3 className="mt-1 font-montserrat-bold">Open in GitHub</h3>
			</Link>

			{project.readme ? (
				<>
					<h1 className="py-4 border-b xs:mt-2 sm:mt-3 lg:mt-4 xs:mb-4 sm:mb-6 lg:mb-8 border-b-black font-montserrat-bold xs:text-lg sm:text-xl lg:text-2xl">
						README.md
					</h1>
					<section className="markdown">
						<ReactMarkdown>{project.readme.replaceAll("<br>", "\n")}</ReactMarkdown>
					</section>
				</>
			) : null}
		</main>
	)
}

export const getServerSideProps: GetServerSideProps<Props> = async context => {
	const github = new Github({ auth: process.env.GITHUB_TOKEN })
	const name = context.params!.name as string

	return await github
		.request("GET /repos/{owner}/{repo}", {
			owner: "zS1L3NT",
			repo: name
		})
		.then(async res => ({
			props: {
				project: {
					name: res.data.name,
					description: res.data.description ?? "",
					topics: res.data.topics ?? [],
					readme: await fetch(
						`https://raw.githubusercontent.com/zS1L3NT/${res.data.name}/main/README.md`
					)
						.then(res => res.text())
						.catch(() => null),
					monorepo: await github
						.request("GET /repos/{owner}/{repo}/contents/{path}", {
							owner: "zS1L3NT",
							repo: name,
							path: "."
						})
						.then(res =>
							Array.isArray(res.data)
								? (res.data as any[])
										.filter(
											f =>
												f.type === "dir" &&
												f.name.includes(name.split("-").at(-1))
										)
										.map(f => f.name)
								: []
						)
						.then(res => (res.length ? res.sort((a, b) => a.localeCompare(b)) : null))
				}
			}
		}))
		.catch(e => {
			console.log(e)

			return {
				notFound: true
			}
		})
}

export default Project