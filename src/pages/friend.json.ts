import { serviceFriendsData } from "@/data/friends";

export function GET() {
	return new Response(
		JSON.stringify({
			friends: serviceFriendsData.map(({ title, siteurl, imgurl }) => [
				title,
				siteurl,
				imgurl,
			]),
		}),
		{
			headers: {
				"Content-Type": "application/json; charset=utf-8",
			},
		},
	);
}
