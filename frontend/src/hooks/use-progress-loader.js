import { useState, useCallback } from "react";
function useProgressLoader(options = {}) {
  const { initialProgress = 10, completionDelay = 500 } = options;
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const startProgress = useCallback(
    (initial = initialProgress) => {
      setProgress(Math.min(Math.max(initial, 0), 100));
      setIsLoading(true);
    },
    [initialProgress]
  );
  const updateProgress = useCallback((value) => {
    setProgress(Math.min(Math.max(value, 0), 100));
  }, []);
  const doneProgress = useCallback(() => {
    setProgress(100);
    const timer = setTimeout(() => setIsLoading(false), completionDelay);
    return () => clearTimeout(timer);
  }, [completionDelay]);
  const resetProgress = useCallback(() => {
    setProgress(0);
    setIsLoading(false);
  }, []);
  return {
    progress,
    isLoading,
    startProgress,
    updateProgress,
    doneProgress,
    resetProgress
  };
}
export {
  useProgressLoader
};
