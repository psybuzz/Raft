Raft
====

Request Animation Frame Threshold helper.  This project includes a small example of a web page that uses raft.js.
The intent is to use Raft whenever you need a recurring function to be called continuously in the background, while maintaining a target number of frames per second.

The example provided includes a page with a large number of DOM elements with changing styles.  It uses Raft to ask the elements to change only when the FPS floats around or above 60.5.  Notice that page scrolling works relatively smoothly compared to scrolling on a page without a Raft object.

If you have ideas on how to improve this code or better apply it, please leave a comment!