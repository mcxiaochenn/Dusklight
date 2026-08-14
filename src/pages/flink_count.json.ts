import { serviceFriendsData } from "@/data/friends";

export function GET() {
	const linkList = serviceFriendsData.map(
		({ title, siteurl, imgurl, desc }) => ({
			name: title,
			link: siteurl,
			avatar: imgurl,
			descr: desc,
		}),
	);

	return new Response(
		JSON.stringify({
			link_list: linkList,
			length: linkList.length,
		}),
		{
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		},
	);
}
