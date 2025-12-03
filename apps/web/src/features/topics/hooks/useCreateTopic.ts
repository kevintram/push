import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateTopicsAndReviews } from "~/utils/invalidateTopicsAndReviews";
import { createTopic } from "../api";

export function useCreateTopic() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: createTopic,
		onSuccess: async () => {
			// Invalidate topic and review queries to reflect the new topic
			await invalidateTopicsAndReviews(queryClient);
		},
	});
}
