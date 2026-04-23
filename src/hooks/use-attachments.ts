import { useCallback, useEffect, useRef, useState } from "react";

export interface Attachment {
	id: string;
	file: File;
	preview: string;
	mediaType: string;
}

function createAttachment(file: File): Attachment {
	return {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		file,
		preview: URL.createObjectURL(file),
		mediaType: file.type || "application/octet-stream"
	};
}

function fileToDataUri(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export function useAttachments() {
	const [attachments, setAttachments] = useState<Attachment[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const attachmentsRef = useRef(attachments);

	useEffect(() => {
		attachmentsRef.current = attachments;
	}, [attachments]);

	useEffect(() => {
		return () => {
			for (const attachment of attachmentsRef.current) {
				URL.revokeObjectURL(attachment.preview);
			}
		};
	}, []);

	const addFiles = useCallback((files: FileList | File[]) => {
		const images = Array.from(files).filter((file) =>
			file.type.startsWith("image/")
		);
		if (images.length === 0) return;

		setAttachments((current) => [
			...current,
			...images.map(createAttachment)
		]);
	}, []);

	const removeAttachment = useCallback((id: string) => {
		setAttachments((current) => {
			const attachment = current.find((item) => item.id === id);
			if (attachment) {
				URL.revokeObjectURL(attachment.preview);
			}
			return current.filter((item) => item.id !== id);
		});
	}, []);

	const clearAttachments = useCallback((current: Attachment[]) => {
		for (const attachment of current) {
			URL.revokeObjectURL(attachment.preview);
		}
		setAttachments([]);
	}, []);

	const buildMessageParts = useCallback(async () => {
		const current = attachmentsRef.current;
		const parts = await Promise.all(
			current.map(async (attachment) => ({
				type: "file" as const,
				mediaType: attachment.mediaType,
				url: await fileToDataUri(attachment.file)
			}))
		);

		clearAttachments(current);
		return parts;
	}, [clearAttachments]);

	const handlePaste = useCallback(
		(event: React.ClipboardEvent<HTMLTextAreaElement>) => {
			const items = event.clipboardData?.items;
			if (!items) return;

			const files: File[] = [];
			for (const item of items) {
				if (item.kind !== "file") continue;
				const file = item.getAsFile();
				if (file) files.push(file);
			}

			if (files.length === 0) return;
			event.preventDefault();
			addFiles(files);
		},
		[addFiles]
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			if (event.dataTransfer.types.includes("Files")) {
				setIsDragging(true);
			}
		},
		[]
	);

	const handleDragLeave = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			if (event.currentTarget === event.target) {
				setIsDragging(false);
			}
		},
		[]
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLElement>) => {
			event.preventDefault();
			event.stopPropagation();
			setIsDragging(false);
			if (event.dataTransfer.files.length > 0) {
				addFiles(event.dataTransfer.files);
			}
		},
		[addFiles]
	);

	return {
		addFiles,
		attachments,
		buildMessageParts,
		handleDragLeave,
		handleDragOver,
		handleDrop,
		handlePaste,
		isDragging,
		removeAttachment
	};
}
